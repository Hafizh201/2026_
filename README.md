# Sistem Voting PEMILOS Offline

## Setup MySQL XAMPP

1. Pastikan Apache dan MySQL aktif di XAMPP.
2. Buka phpMyAdmin, pilih menu **Import**, lalu jalankan file [`database/pemilos_mysql.sql`](database/pemilos_mysql.sql).
3. Dari PowerShell, pasang driver database:

```powershell
npm install mysql2
```

Koneksi default di [`lib/db.ts`](lib/db.ts) menggunakan `localhost:3306`, user `root`, password kosong, dan database `pemilos_db`. Nilai tersebut bisa dioverride dengan `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` di `.env.local`.

## Menjalankan aplikasi

```powershell
npm run dev
```

Pemilih memindai QR di client, lalu `POST /api/verify-qr` memeriksa token pada tabel `token_akses` dan memastikan belum ada suara di tabel `votes` untuk token tersebut. Pemeriksaan suara yang sama juga dilakukan oleh `GET /api/auth/me` dan `POST /api/vote`, sehingga status `sudah_memilih` yang tidak sinkron tidak dapat membuka jalan untuk mengirim suara kedua. Token ditandai `sudah_memilih = 1` setelah suara berhasil disimpan.

## Sinkronisasi cadangan suara ke Supabase

Worker terpisah di [`scripts/background-sync.js`](scripts/background-sync.js) memeriksa antrean lokal `is_synced = 0` setiap detik, dan hanya menghubungi Supabase jika ada baris tertunda. Audit penuh berjalan setiap lima menit secara default; interval dapat diatur lewat `SYNC_FULL_RECONCILE_MS` (minimum 60 detik). Audit membandingkan data lokal dengan cloud, lalu mengunggah atau memperbarui baris lokal di Supabase. Baris yang hanya ada di cloud tetap dipertahankan karena beberapa laptop dapat mengirim data ke project Supabase yang sama; worker tidak menghapus baris dari Supabase. Upload dilakukan per kelompok 100 baris. Pemetaan kolomnya: `votes.id` → `hasil_suara.id`, `candidate_id` → `nomor_paslon`, `created_at` → `waktu_coblos_lokal`; `signature` dikirim kosong dan `waktu_terima_server` memakai default waktu Supabase. Setelah data lokal berhasil dicocokkan, worker menandai `is_synced = 1` di MySQL. Terminal hanya mencatat perubahan, upload, dan error; pesan error yang sama dibatasi maksimal sekali per menit.

### 1. Siapkan MySQL lokal

Untuk database yang sudah ada, jalankan **satu kali** [`database/add-vote-sync-column.sql`](database/add-vote-sync-column.sql) melalui phpMyAdmin. Untuk instalasi baru, kolom `is_synced` sudah tercantum di [`database/pemilos_mysql.sql`](database/pemilos_mysql.sql).

### 2. Siapkan tabel Supabase

Buat project Supabase, buka **SQL Editor**, lalu jalankan isi [`database/supabase-votes.sql`](database/supabase-votes.sql). Tabel cloud memiliki batas unik pada `token`, sehingga satu token tidak dapat tercatat dua kali.

### 3. Isi konfigurasi worker

Ambil Project URL dan server-side Secret API key dari dashboard Supabase (**Connect** atau **Settings → API Keys**), lalu tambahkan ke file `.env.local` di root project:

```dotenv
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Gunakan secret key server-side (`sb_secret_...`); worker juga menerima `SUPABASE_SERVICE_ROLE_KEY` untuk project yang masih memakai key lama. Jangan gunakan prefix `NEXT_PUBLIC_` dan jangan commit nilai rahasianya. Supabase secret key melewati Row Level Security, jadi hanya simpan di lingkungan worker yang dipercaya. [Panduan resmi API keys Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

### 4. Jalankan aplikasi dan worker

```powershell
npm run dev:sync
```

Perintah tersebut menjalankan Next.js dan worker sebagai proses terpisah secara bersamaan. Untuk menjalankan worker saja, gunakan `npm run sync:cloud`. Pastikan MySQL/XAMPP aktif sebelum worker dijalankan.
