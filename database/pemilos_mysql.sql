CREATE DATABASE IF NOT EXISTS pemilos_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pemilos_db;

CREATE TABLE IF NOT EXISTS token_akses (
  token VARCHAR(255) NOT NULL,
  sudah_memilih TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (token)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS candidates (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(150) NOT NULL,
  photo VARCHAR(255) NOT NULL,
  ketua VARCHAR(150) NOT NULL,
  wakil VARCHAR(150) NOT NULL,
  PRIMARY KEY (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS votes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  token VARCHAR(255) NOT NULL,
  candidate_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_vote_token (token),
  CONSTRAINT fk_votes_token FOREIGN KEY (token) REFERENCES token_akses (token),
  CONSTRAINT fk_votes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id)
) ENGINE = InnoDB;

INSERT IGNORE INTO candidates (id, nama, photo, ketua, wakil) VALUES
  (1, 'Pasangan Calon 1', '/candidates/paslon-1.jpg', 'Nama Ketua 1', 'Nama Wakil 1'),
  (2, 'Pasangan Calon 2', '/candidates/paslon-2.jpg', 'Nama Ketua 2', 'Nama Wakil 2'),
  (3, 'Pasangan Calon 3', '/candidates/paslon-3.jpg', 'Nama Ketua 3', 'Nama Wakil 3');

INSERT IGNORE INTO token_akses (token, sudah_memilih) VALUES
  ('PEMILOS-2026-001', 0),
  ('PEMILOS-2026-002', 0),
  ('PEMILOS-2026-003', 0),
  ('PEMILOS-2026-USED', 1)
