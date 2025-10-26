# SQL File Execution Scripts

Scripts untuk menjalankan file SQL ke database PostgreSQL.

## ⚠️ Important Note

File `dbElearningLocal_full.sql` berukuran **36MB**. Untuk file sebesar ini ke **Neon DB** (cloud database), ada beberapa kendala:
- ⏱️ Connection timeout
- 📦 File terlalu besar untuk upload sekaligus
- 🌐 Network overhead tinggi

## 🎯 **RECOMMENDED SOLUTIONS:**

### **Opsi 1: Gunakan Prisma + Seed Scripts** ⭐⭐⭐ (PALING MUDAH)
Karena Anda sudah punya schema Prisma dan seed scripts lengkap:

```bash
# Reset dan migrate database
npx prisma migrate reset --force

# Atau push schema tanpa hapus data
npx prisma db push

# Jalankan seed scripts
node prisma/seed-all-subjects-complete.js
node prisma/seed-missing-submissions-and-skills.js
```

### **Opsi 2: Split SQL File** ⭐⭐ (Untuk Neon DB)
Split file SQL besar menjadi chunks kecil, lalu import satu per satu:

```bash
# 1. Split SQL file
node scripts/split-sql.js

# 2. Import semua chunks secara otomatis
node scripts/run-all-chunks.js

# Atau import manual satu per satu
node scripts/run-sql-batch.js sql-chunks/chunk_001.sql
node scripts/run-sql-batch.js sql-chunks/chunk_002.sql
```

### **Opsi 3: GUI Tools** ⭐ (Untuk local PostgreSQL)
Gunakan GUI tools untuk import (hanya bisa ke local DB):
- **pgAdmin 4** - Free dan powerful
- **DBeaver** - Free dan cross-platform
- **TablePlus** - Elegant dan user-friendly

### **Opsi 4: psql Command Line** (Untuk local PostgreSQL)
Command line PostgreSQL client (paling cepat, hanya untuk local):

```bash
psql "postgresql://neondb_owner:npg_dTkCyJGE6B9K@ep-floral-fog-aha8jsjl-pooler.c-3.us-east-1.aws.neon.tech/dbElearningYOTM?sslmode=require" -f dbElearningLocal_full.sql
```

---

## Available Scripts

### 1. `run-sql-batch.js` ⭐ (RECOMMENDED untuk file besar)
Menggunakan library `pg` dengan batching otomatis. Cocok untuk file besar yang sering timeout.

**Cara Pakai:**
```bash
# Default: menjalankan dbElearningLocal_full.sql
node scripts/run-sql-batch.js

# Custom SQL file
node scripts/run-sql-batch.js path/to/your-file.sql
```

**Kelebihan:**
- ✅ Handle file besar dengan batching
- ✅ Progress indicator
- ✅ Error recovery (skip non-critical errors)
- ✅ Tidak perlu install PostgreSQL tools
- ✅ Cross-platform (Windows, Mac, Linux)

**Output:**
```
📦 Batch 1/350 (100/35000 statements)...
📦 Batch 2/350 (200/35000 statements)...
...
✅ SQL execution completed!
   Total statements: 35000
   Successfully executed: 34950
   Errors: 50
   ⏱️  Duration: 120.45 seconds
```

### 2. `run-sql.js` (Untuk file kecil saja)
Script sederhana tanpa batching. **TIDAK RECOMMENDED untuk file > 5MB**.

**Cara Pakai:**
```bash
# Default: menjalankan dbElearningLocal_full.sql
node scripts/run-sql.js

# Custom SQL file
node scripts/run-sql.js path/to/your-file.sql
```

**Kelebihan:**
- ✅ Sederhana dan cepat untuk file kecil
- ✅ Tidak perlu install PostgreSQL tools

**Kekurangan:**
- ❌ Tidak cocok untuk file besar (akan timeout)
- ❌ No progress indicator

### 3. `run-sql-with-psql.js`
Menggunakan command line `psql`. Memerlukan PostgreSQL terinstall di sistem.

**Cara Pakai:**
```bash
# Default: menjalankan dbElearningLocal_full.sql
node scripts/run-sql-with-psql.js

# Custom SQL file
node scripts/run-sql-with-psql.js path/to/your-file.sql
```

**Kelebihan:**
- ✅ Paling cepat untuk file besar
- ✅ Support semua fitur PostgreSQL
- ✅ Native PostgreSQL tool

**Kekurangan:**
- ❌ Memerlukan PostgreSQL terinstall di sistem
- ❌ Perlu setup PATH untuk `psql` command

## Prerequisites

Untuk `run-sql.js`:
- Node.js
- Library `pg` (sudah ada di package.json)

Untuk `run-sql-with-psql.js`:
- Node.js
- PostgreSQL installed (untuk `psql` command)

## Configuration

Script akan otomatis membaca `DATABASE_URL` dari file `.env`:

```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## Examples

### Menjalankan file SQL default
```bash
node scripts/run-sql.js
```

### Menjalankan file SQL custom
```bash
node scripts/run-sql.js backup/my-backup.sql
```

### Output yang diharapkan
```
🚀 Starting SQL file execution...

📁 SQL File: D:\code\e-learning-yotm-nextjs\dbElearningLocal_full.sql
🔗 Database URL: postgresql://username:***@host:port/database

🔌 Connecting to database...
✅ Connected to database

📖 Reading SQL file...
✅ SQL file read successfully (1234567 characters)

⚙️  Executing SQL commands...

⏳ This may take a while depending on the file size...

✅ SQL file executed successfully!
⏱️  Duration: 12.34 seconds

🎉 Done!

🔌 Database connection closed
```

## Troubleshooting

### Error: "pg" module not found
```bash
npm install pg
```

### Error: "psql command not found" (untuk run-sql-with-psql.js)
Gunakan `run-sql.js` sebagai alternatif, atau install PostgreSQL.

### Error: Connection timeout
- Check koneksi internet
- Pastikan DATABASE_URL benar
- Cek firewall/network settings

### Error: Syntax error in SQL
- Pastikan file SQL valid
- Cek encoding file (harus UTF-8)
- Lihat error message untuk posisi error

## Notes

- Script akan otomatis close connection setelah selesai
- File SQL yang besar mungkin memerlukan waktu lama
- Pastikan backup database sebelum menjalankan SQL file baru
- Script akan menampilkan progress dan error yang jelas
