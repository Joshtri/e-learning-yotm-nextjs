# 🌱 Database Seeding Guide

## 📊 Data yang Telah Dibuat

### ✅ Ringkasan:
- **12 Quiz** (1 untuk setiap mata pelajaran)
- **19 Assignment** terdiri dari:
  - 5 UTS (Ujian Tengah Semester)
  - 2 UAS (Ujian Akhir Semester)
  - 12 Tugas/Exercise

### 📝 Detail Quiz (12):

1. **Matematika** - Trigonometri
2. **Bahasa Indonesia** - Teks Eksposisi
3. **Bahasa Inggris** - Past Tense
4. **Ekonomi** - Konsep Dasar Ekonomi
5. **Geografi** - Litosfer
6. **Sejarah** - Perjuangan Kemerdekaan Indonesia
7. **Sosiologi** - Interaksi Sosial
8. **Seni Budaya** - Seni Rupa
9. **Pendidikan Agama** - Iman dan Takwa
10. **PKn** - Pancasila
11. **PJOK** - Permainan Bola Besar
12. **TIK** - Perangkat Keras Komputer

*Note: IPA dan IPS tidak ada quiz tambahan karena quiz sudah dibuat di seed.js utama*

### 📋 Detail Assignment (19):

#### UTS (5):
1. **Matematika** Kelas 11 Semester Ganjil 2025
2. **Bahasa Indonesia** Kelas 11 Semester Ganjil 2025
3. **Ekonomi** Kelas 11 Semester Ganjil 2025
4. **Geografi** Kelas 11 Semester Ganjil 2025
5. **Sejarah** Kelas 11 Semester Ganjil 2025

#### UAS (2):
1. **Matematika** Kelas 11 Semester Ganjil 2025
2. **Bahasa Inggris** Grade 11 Odd Semester 2025

#### Tugas/Exercise (12):
1. **Matematika** - Limit Fungsi
2. **Bahasa Indonesia** - Menulis Teks Eksposisi
3. **Bahasa Inggris** - Descriptive Text
4. **Ekonomi** - Sistem Ekonomi
5. **Geografi** - Peta dan Penginderaan Jauh
6. **Sejarah** - Pergerakan Nasional Indonesia
7. **Sosiologi** - Penelitian Sosial Sederhana
8. **Seni Budaya** - Karya Seni Rupa 2 Dimensi
9. **Pendidikan Agama** - Akhlak Mulia
10. **PKn** - HAM di Indonesia
11. **PJOK** - Kebugaran Jasmani
12. **TIK** - Presentasi Multimedia

---

## 🚀 Cara Menjalankan Seeding

### 1. Seed Utama (Quiz 3 + Assignment 10)
```bash
node prisma/seed.js
```
atau
```bash
npm run seed
```

### 2. Seed Quiz Tambahan (9 quiz)
```bash
node prisma/seed-additional.js
```

### 3. Seed Tugas Tambahan (9 tugas)
```bash
node prisma/seed-tugas.js
```

### 4. Jalankan Semua Sekaligus
```bash
node prisma/seed.js && node prisma/seed-additional.js && node prisma/seed-tugas.js
```

---

## 📖 File-file Seeding

| File | Deskripsi | Konten |
|------|-----------|--------|
| `seed.js` | Seed utama | 3 Quiz + 10 Assignment (UTS/UAS/Tugas) |
| `seed-additional.js` | Quiz tambahan | 9 Quiz untuk semua mapel |
| `seed-tugas.js` | Tugas tambahan | 9 Tugas untuk semua mapel |
| `check-db.js` | Cek database | Melihat data yang ada |
| `seed.js.backup` | Backup | Backup file seed utama |

---

## 🔍 Cek Hasil Seeding

```bash
node prisma/check-db.js
```

Output akan menampilkan:
- Jumlah kelas
- Jumlah mata pelajaran
- Relasi ClassSubjectTutor
- **Jumlah Quiz yang ada**
- **Jumlah Assignment yang ada**

---

## ⚠️ Catatan Penting

1. **Tidak membuat data duplikat**: Setiap file seed akan cek dulu apakah data sudah ada
2. **Dinamis**: Mengambil ID dari database yang ada (tidak hardcode)
3. **Hanya untuk Kelas 11**: Filter otomatis untuk Kelas 11 (Paket C)
4. **12 Mata Pelajaran**: Sesuai dengan data yang ada di database

---

## 🎯 Target Seeding

- [x] Kuis untuk 12 mata pelajaran
- [x] UTS untuk 5 mata pelajaran (Matematika, Bahasa Indonesia, Ekonomi, Geografi, Sejarah)
- [x] UAS untuk 2 mata pelajaran (Matematika, Bahasa Inggris)
- [x] Tugas untuk 12 mata pelajaran
- [x] Tidak membuat User/Tutor/Kelas baru
- [x] Menggunakan ID dari database

---

## 📌 Struktur Soal

Setiap Quiz/Assignment memiliki berbagai jenis soal:

1. **MULTIPLE_CHOICE** - Pilihan ganda (A, B, C, D)
2. **TRUE_FALSE** - Benar/Salah
3. **SHORT_ANSWER** - Jawaban singkat
4. **ESSAY** - Essay panjang

---

## 🔄 Reset Data (Opsional)

Jika ingin reset semua Quiz dan Assignment:

```sql
DELETE FROM "AnswerOption";
DELETE FROM "Answer";
DELETE FROM "Question";
DELETE FROM "Submission";
DELETE FROM "Quiz";
DELETE FROM "Assignment";
```

Lalu jalankan ulang seeding.

---

## 📞 Support

Jika ada masalah, cek:
1. Apakah Prisma Client sudah di-generate? (`npx prisma generate`)
2. Apakah database sudah connect?
3. Apakah data ClassSubjectTutor sudah ada?

---

**Created with ❤️ for Kelas 11 - E-Learning YOTM**
