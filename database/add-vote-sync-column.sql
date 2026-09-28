-- Jalankan satu kali pada database MySQL yang sudah memiliki tabel votes.
ALTER TABLE votes
  ADD COLUMN is_synced TINYINT(1) NOT NULL DEFAULT 0,
  ADD KEY idx_votes_sync (is_synced, id);
