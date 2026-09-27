CREATE DATABASE IF NOT EXISTS pemilos_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pemilos_db;

CREATE TABLE IF NOT EXISTS token_akses (
  token VARCHAR(255) NOT NULL,
  sudah_memilih TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (token)
) ENGINE = InnoDB;

INSERT IGNORE INTO token_akses (token, sudah_memilih) VALUES
  ('PEMILOS-2026-001', 0),
  ('PEMILOS-2026-002', 0),
  ('PEMILOS-2026-003', 0),
  ('PEMILOS-2026-USED', 1)
