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

Pemilih memindai QR di client, lalu `POST /api/verify-qr` memeriksa token pada tabel `token_akses`. Token yang valid langsung ditandai `sudah_memilih = 1` dan diterbitkan sebagai cookie session `auth_session`.