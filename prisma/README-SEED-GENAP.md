# 🌱 Database Seeding - Semester GENAP 2025/2026

## 📊 Data yang Telah Dibuat untuk Semester GENAP

### ✅ Ringkasan:
- **10+ Materi Pembelajaran** (untuk berbagai mata pelajaran)
- **8 Tugas/Assignment**
- **6 UTS** (Ujian Tengah Semester)
- **2 UAS** (Ujian Akhir Semester)

---

## 📚 Detail Materi Pembelajaran

### Matematika (2 materi):
1. Matriks dan Operasi Matriks - Pertemuan 1
2. Determinan dan Invers Matriks - Pertemuan 2

### Bahasa Indonesia (2 materi):
1. Teks Cerita Pendek (Cerpen) - Pertemuan 1
2. Menulis Cerpen - Pertemuan 2

### Bahasa Inggris (2 materi):
1. Narrative Text - Legends and Folktales - Pertemuan 1
2. Conditional Sentences - Type 1 and 2 - Pertemuan 2

### Ekonomi (1 materi):
1. Kebijakan Moneter dan Fiskal - Pertemuan 1

### Geografi (1 materi):
1. Mitigasi dan Adaptasi Bencana - Pertemuan 1

### Sejarah (1 materi):
1. Proklamasi Kemerdekaan Indonesia - Pertemuan 1

### Sosiologi (1 materi):
1. Konflik Sosial dan Integrasi Sosial - Pertemuan 1

---

## 📝 Detail Tugas/Assignment (8)

| No | Mata Pelajaran | Judul Tugas | Tanggal | Jenis |
|----|----------------|-------------|---------|-------|
| 1  | Matematika | Matriks dan Determinan | 10-20 Feb 2026 | EXERCISE |
| 2  | Bahasa Indonesia | Menulis Cerpen | 15 Feb - 15 Mar 2026 | PROJECT |
| 3  | Bahasa Inggris | Writing Narrative Text | 20 Feb - 5 Mar 2026 | EXERCISE |
| 4  | Ekonomi | Analisis Kebijakan Moneter | 1-15 Mar 2026 | EXERCISE |
| 5  | Geografi | Mitigasi Bencana | 10 Mar - 10 Apr 2026 | PROJECT |
| 6  | Sejarah | Proklamasi Kemerdekaan | 20 Mar - 5 Apr 2026 | EXERCISE |
| 7  | Sosiologi | Penelitian Konflik Sosial | 1-30 Apr 2026 | PROJECT |
| 8  | Seni Budaya | Apresiasi Seni Musik Nusantara | 15 Mar - 15 Apr 2026 | PROJECT |

---

## 📋 Detail UTS (6)

Periode UTS: **15-23 Maret 2026**

| No | Mata Pelajaran | Materi | Tanggal |
|----|----------------|--------|---------|
| 1  | Matematika | Matriks, Determinan, Invers | 15-18 Mar 2026 |
| 2  | Bahasa Indonesia | Cerpen dan Drama | 16-19 Mar 2026 |
| 3  | Bahasa Inggris | Narrative Text & Conditional | 17-20 Mar 2026 |
| 4  | Ekonomi | Kebijakan Moneter & Fiskal | 18-21 Mar 2026 |
| 5  | Geografi | Mitigasi & Adaptasi Bencana | 19-22 Mar 2026 |
| 6  | Sejarah | Proklamasi Kemerdekaan | 20-23 Mar 2026 |

---

## 📋 Detail UAS (2)

Periode UAS: **20-26 Mei 2026**

| No | Mata Pelajaran | Materi | Tanggal |
|----|----------------|--------|---------|
| 1  | Matematika | Matriks, Vektor, Transformasi | 20-25 Mei 2026 |
| 2  | Bahasa Inggris | All Materials Even Semester | 21-26 Mei 2026 |

---

## 🚀 Cara Menjalankan Seeding

### Prasyarat
⚠️ **PENTING**: Pastikan sudah ada:
1. Tahun Akademik **2025/2026 Semester GENAP** di database
2. Kelas 11 sudah dipindahkan ke semester GENAP
3. ClassSubjectTutor sudah dibuat untuk semester GENAP

### 1. Seed Materi Pembelajaran
```bash
node prisma/seed-genap-materi.js
```

### 2. Seed Tugas
```bash
node prisma/seed-genap-tugas.js
```

### 3. Seed UTS & UAS
```bash
node prisma/seed-genap-uts-uas.js
```

### 4. Seed Nilai/Submissions
```bash
node prisma/seed-nilai-genap.js
```

### 5. Seed Attendance
```bash
node prisma/seed-attendance-genap.js
```

### 6. Jalankan Semua Sekaligus (Urutan Penting!)
```bash
node prisma/seed-genap-materi.js && node prisma/seed-genap-tugas.js && node prisma/seed-genap-uts-uas.js && node prisma/seed-nilai-genap.js && node prisma/seed-attendance-genap.js
```

---

## 📁 File-file Seeding Semester GENAP

| File | Deskripsi | Jumlah Data |
|------|-----------|-------------|
| `seed-genap-materi.js` | Materi pembelajaran | 10+ materi |
| `seed-genap-tugas.js` | Tugas/Assignment | 8 tugas |
| `seed-genap-uts-uas.js` | UTS & UAS | 6 UTS + 2 UAS |
| `seed-nilai-genap.js` | Nilai (Submissions, Behavior, Skill) | ~500+ submissions |
| `seed-attendance-genap.js` | Presensi Oktober 2025 | 20+ sessions |

---

## 🔍 Cek Hasil Seeding

```bash
node prisma/check-db.js
```

Output akan menampilkan total LearningMaterial, Assignment, dan Quiz yang ada di database.

---

## ⚠️ Catatan Penting

1. **Filter Otomatis**: Hanya membuat data untuk Kelas 11 Semester GENAP 2025/2026
2. **Dinamis**: Mengambil ID dari database yang ada (tidak hardcode)
3. **Tidak Duplikat**: Beberapa seed file bisa dijalankan multiple kali (akan create duplicate)
4. **Tahun Akademik**: Pastikan tahun akademik GENAP sudah dibuat di database
5. **ClassSubjectTutor**: Data akan error jika ClassSubjectTutor untuk semester GENAP belum ada
6. **⚠️ URUTAN SEEDING PENTING**:
   - Jalankan `seed-genap-materi.js` terlebih dahulu
   - Lalu `seed-genap-tugas.js` dan `seed-genap-uts-uas.js`
   - **BARU** jalankan `seed-nilai-genap.js` (butuh assignments/quizzes sudah ada!)
   - Terakhir `seed-attendance-genap.js`
7. **Nilai Realistis**: Script menggunakan distribusi nilai yang realistis (bell curve)

---

## 📌 Struktur Data

### Materi Pembelajaran
- Judul
- Pertemuan (1, 2, 3, dst)
- Konten (Markdown)
- Tipe Materi: `FILE` atau `LINK_YOUTUBE`
- URL File (opsional)

### Tugas/Assignment
- Judul
- Deskripsi
- Jenis: `EXERCISE`, `PROJECT`, `MIDTERM`, `FINAL`
- Tanggal Mulai & Selesai
- Nilai Maksimal: 100
- Questions dengan berbagai jenis soal

### Jenis Soal
1. **MULTIPLE_CHOICE** - Pilihan ganda (A, B, C, D)
2. **TRUE_FALSE** - Benar/Salah
3. **SHORT_ANSWER** - Jawaban singkat
4. **ESSAY** - Essay panjang

### Nilai/Submissions
- Status: `GRADED` (sudah dinilai)
- Distribusi nilai realistis:
  - 10% excellent (90-100)
  - 30% good (80-89)
  - 40% average (70-79)
  - 15% below average (60-69)
  - 5% low (50-59)
- Tanggal submit: random antara tanggal mulai dan selesai
- Mencakup: Tugas, UTS, UAS, Quiz

### Behavior Scores
- Spiritual: 70-95
- Sosial: 70-95
- Kehadiran: 75-100

### Skill Scores
- Per mata pelajaran
- Range: 70-95
- Keterangan otomatis

---

## 🎯 Timeline Semester GENAP 2025/2026

| Periode | Kegiatan |
|---------|----------|
| Januari 2026 | Mulai semester GENAP |
| Februari - April 2026 | Periode tugas & quiz |
| 15-23 Maret 2026 | **UTS** |
| April 2026 | Tugas akhir |
| 20-26 Mei 2026 | **UAS** |
| Juni 2026 | Selesai semester GENAP |

---

## 🔄 Reset Data (Jika Diperlukan)

Jika ingin reset data semester GENAP saja:

```sql
-- Hapus data semester GENAP 2025/2026
DELETE FROM "LearningMaterial"
WHERE "classSubjectTutorId" IN (
  SELECT id FROM "ClassSubjectTutor"
  WHERE "classId" IN (
    SELECT id FROM "Class"
    WHERE "academicYearId" = '[ID_TAHUN_AKADEMIK_GENAP]'
  )
);

DELETE FROM "AnswerOption"
WHERE "questionId" IN (
  SELECT q.id FROM "Question" q
  JOIN "Assignment" a ON a.id = q."assignmentId" OR a.id = q."quizId"
  JOIN "ClassSubjectTutor" cst ON cst.id = a."classSubjectTutorId"
  JOIN "Class" c ON c.id = cst."classId"
  WHERE c."academicYearId" = '[ID_TAHUN_AKADEMIK_GENAP]'
);

-- Dan seterusnya untuk Assignment, Quiz, dll
```

---

## 📞 Troubleshooting

### Error: "No subjects found for Kelas 11 Semester GENAP"
**Solusi**:
1. Pastikan tahun akademik 2025/2026 GENAP sudah dibuat
2. Pastikan Kelas 11 sudah dipindahkan ke semester GENAP
3. Pastikan ClassSubjectTutor sudah dibuat untuk semester GENAP

### Error: "classSubjectTutorId tidak valid"
**Solusi**: Regenerasi ClassSubjectTutor untuk semester GENAP dengan script terpisah atau melalui UI admin

### Data tidak muncul
**Solusi**: Cek di database apakah tahun akademik yang benar sudah aktif

---

## 🎓 Mata Pelajaran yang Ter-cover

✅ Matematika
✅ Bahasa Indonesia
✅ Bahasa Inggris
✅ Ekonomi
✅ Geografi
✅ Sejarah
✅ Sosiologi
✅ Seni Budaya

---

**Created with ❤️ for Kelas 11 Semester GENAP - E-Learning YOTM**

**Tahun Akademik**: 2025/2026 Semester GENAP
**Target**: Kelas 11 (Paket C)
