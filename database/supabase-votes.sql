-- Sesuaikan dengan tabel hasil_suara yang dipakai worker.
-- Jalankan di Supabase Dashboard > SQL Editor.
CREATE TABLE IF NOT EXISTS public.hasil_suara (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  nomor_paslon INTEGER NOT NULL,
  waktu_coblos_lokal TIMESTAMPTZ NOT NULL,
  waktu_terima_server TIMESTAMPTZ DEFAULT NOW(),
  signature TEXT NOT NULL
);

ALTER TABLE public.hasil_suara ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hasil_suara TO service_role;
