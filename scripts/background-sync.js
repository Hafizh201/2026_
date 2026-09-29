'use strict';

const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
const path = require('node:path');

try {
  process.loadEnvFile(path.resolve(__dirname, '../.env.local'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const intervalMs = 1000;
const batchSize = 100;
const comparePageSize = 500;
const fullReconcileIntervalMs = Math.max(
  60_000,
  Number(process.env.SYNC_FULL_RECONCILE_MS) || 5 * 60 * 1000
);
const supabaseUrl = process.env.SUPABASE_URL;

function getSupabaseKeyRole(key) {
  if (key.startsWith('sb_secret_')) return 'secret';
  if (key.startsWith('sb_publishable_')) return 'publishable';

  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.role === 'string' ? payload.role : 'unknown';
  } catch {
    return 'unknown';
  }
}

const configuredKeys = [
  { name: 'SUPABASE_SECRET_KEY', value: process.env.SUPABASE_SECRET_KEY },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY },
].filter((entry) => entry.value);
const serverKey = configuredKeys.find((entry) => {
  const role = getSupabaseKeyRole(entry.value);
  return role === 'secret' || role === 'service_role';
});

if (!supabaseUrl) {
  throw new Error('Set SUPABASE_URL in the project root .env.local.');
}
if (!serverKey) {
  const detectedRoles = configuredKeys.map((entry) => `${entry.name}=${getSupabaseKeyRole(entry.value)}`).join(', ');
  throw new Error(`A server-side Supabase key is required. Use sb_secret_... or a legacy service_role key. Detected: ${detectedRoles || 'no key configured'}.`);
}
const supabaseSecretKey = serverKey.value;

const localDb = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pemilos_db',
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  timezone: 'Z',
});

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

let isSyncing = false;
let isShuttingDown = false;
let lastFullReconcileAttemptAt = 0;
let lastErrorKey = '';
let lastErrorLogAt = 0;
let retryNotBefore = 0;
let retryDelayMs = 0;

function log(message) {
  const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
  console.log(`[SYNC ${time}] ${message}`);
}

function toIsoTimestamp(value) {
  const timestamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(timestamp.getTime())) throw new Error('Invalid created_at timestamp in local votes table.');
  return timestamp.toISOString();
}

function toCloudVote(row) {
  return {
    id: String(row.id),
    token: row.token,
    nomor_paslon: Number(row.candidate_id),
    waktu_coblos_lokal: toIsoTimestamp(row.created_at),
    signature: '',
  };
}

function rowsMatch(localRow, cloudRow) {
  const expected = toCloudVote(localRow);
  return String(cloudRow.id) === expected.id &&
    cloudRow.token === expected.token &&
    Number(cloudRow.nomor_paslon) === expected.nomor_paslon &&
    Date.parse(cloudRow.waktu_coblos_lokal) === Date.parse(expected.waktu_coblos_lokal) &&
    cloudRow.signature === expected.signature;
}

function splitIntoBatches(rows, size) {
  const batches = [];
  for (let index = 0; index < rows.length; index += size) {
    batches.push(rows.slice(index, index + size));
  }
  return batches;
}

async function loadAllCloudVotes() {
  const cloudRows = [];

  for (let offset = 0; ; offset += comparePageSize) {
    const { data, error } = await supabase
      .from('hasil_suara')
      .select('id, token, nomor_paslon, waktu_coblos_lokal, signature')
      .order('id', { ascending: true })
      .range(offset, offset + comparePageSize - 1);

    if (error) throw error;
    cloudRows.push(...(data || []));
    if (!data || data.length < comparePageSize) return cloudRows;
  }
}

async function loadCloudVotesForTokens(tokens) {
  const cloudRows = [];
  for (const batch of splitIntoBatches(tokens, batchSize)) {
    const { data, error } = await supabase
      .from('hasil_suara')
      .select('id, token, nomor_paslon, waktu_coblos_lokal, signature')
      .in('token', batch);
    if (error) throw error;
    cloudRows.push(...(data || []));
  }
  return cloudRows;
}

async function markLocalRowsSynced(connection, rows) {
  let updatedRows = 0;
  for (const batch of splitIntoBatches(rows, batchSize)) {
    const ids = batch.map((row) => row.id);
    const placeholders = ids.map(() => '?').join(', ');
    const [result] = await connection.execute(
      `UPDATE votes SET is_synced = 1 WHERE is_synced = 0 AND id IN (${placeholders})`,
      ids
    );
    updatedRows += result.affectedRows;
  }
  return updatedRows;
}

function logFailure(error) {
  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String(error.message)
    : String(error);
  const now = Date.now();
  if (message !== lastErrorKey || now - lastErrorLogAt >= 60_000) {
    log(`Sinkronisasi gagal: ${message}. Akan dicoba lagi.`);
    lastErrorKey = message;
    lastErrorLogAt = now;
  }
}

async function syncData() {
  if (isShuttingDown) return;
  if (Date.now() < retryNotBefore) return;
  if (isSyncing) return;

  isSyncing = true;

  let connection;
  try {
    connection = await localDb.getConnection();
    // Read TIMESTAMP values consistently before converting them to ISO for Postgres.
    await connection.query("SET time_zone = '+00:00'");

    const isFullReconcile = Date.now() - lastFullReconcileAttemptAt >= fullReconcileIntervalMs;
    if (isFullReconcile) lastFullReconcileAttemptAt = Date.now();
    const [localRows] = await connection.execute(
      isFullReconcile
        ? 'SELECT id, token, candidate_id, created_at FROM votes ORDER BY id ASC'
        : 'SELECT id, token, candidate_id, created_at FROM votes WHERE is_synced = 0 ORDER BY id ASC LIMIT ?',
      isFullReconcile ? [] : [batchSize]
    );

    // Fast path: only query Supabase when local rows are waiting to be synchronized.
    if (!isFullReconcile && localRows.length === 0) {
      return;
    }

    const cloudRows = isFullReconcile
      ? await loadAllCloudVotes()
      : await loadCloudVotesForTokens(localRows.map((row) => row.token));
    const cloudRowsByToken = new Map(cloudRows.map((row) => [row.token, row]));
    const differences = localRows.filter((row) => {
      const cloudRow = cloudRowsByToken.get(row.token);
      return !cloudRow || !rowsMatch(row, cloudRow);
    });
    const uploadBatches = splitIntoBatches(differences, batchSize);
    for (const [index, batch] of uploadBatches.entries()) {
      if (index === 0) log(`Ditemukan ${differences.length} perbedaan; mulai mengunggah ke Supabase.`);
      if (uploadBatches.length > 1) log(`Mengunggah batch ${index + 1}/${uploadBatches.length} (${batch.length} suara)...`);
      const { error } = await supabase
        .from('hasil_suara')
        .upsert(batch.map(toCloudVote), { onConflict: 'token' });
      if (error) throw error;
    }

    const updatedLocalRows = await markLocalRowsSynced(connection, localRows);
    if (differences.length > 0) log(`${differences.length} suara berhasil disamakan ke Supabase.`);
    if (updatedLocalRows > 0 && differences.length === 0) log(`${updatedLocalRows} suara lokal yang sudah cocok ditandai tersinkron.`);

    if (lastErrorKey) log('Koneksi pulih; sinkronisasi dilanjutkan.');
    lastErrorKey = '';
    lastErrorLogAt = 0;
    retryDelayMs = 0;
    retryNotBefore = 0;
  } catch (error) {
    logFailure(error);
    retryDelayMs = retryDelayMs === 0 ? 2_000 : Math.min(60_000, retryDelayMs * 2);
    retryNotBefore = Date.now() + retryDelayMs;
  } finally {
    if (connection) connection.release();
    isSyncing = false;
  }
}

log(`Worker aktif; antrean lokal dicek tiap ${intervalMs / 1000} detik, audit penuh tiap ${Math.round(fullReconcileIntervalMs / 60_000)} menit.`);
log(`Supabase key terdeteksi sebagai server key (${getSupabaseKeyRole(supabaseSecretKey)}).`);
const interval = setInterval(() => void syncData(), intervalMs);
void syncData();

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  clearInterval(interval);
  await localDb.end();
}

process.once('SIGINT', () => void shutdown().finally(() => process.exit(0)));
process.once('SIGTERM', () => void shutdown().finally(() => process.exit(0)));
