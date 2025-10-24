# Student History Fix - Academic Year Reports

## 🔍 Diagnosa Masalah

### Problem
Saat homeroom teacher mencoba melihat laporan siswa untuk tahun ajaran sebelumnya (historical data), tidak ada siswa yang muncul di dropdown meskipun siswa tersebut pernah belajar di kelas tersebut pada tahun ajaran tersebut.

### Root Cause
API `/homeroom/my-students` hanya mencari siswa berdasarkan `student.classId` yang **aktif saat ini**. Ketika siswa naik kelas:
- Field `student.classId` berubah ke kelas baru
- Siswa yang sudah naik kelas tidak lagi memiliki `classId` yang sama dengan kelas lama
- Query untuk tahun ajaran lama tidak menemukan siswa tersebut

**Contoh:**
- Tahun ajaran 2024/2025 GENAP: Siswa A di Kelas 10 (classId: cls_123)
- Siswa A naik kelas
- Tahun ajaran 2025/2026 GANJIL: Siswa A sekarang di Kelas 11 (classId: cls_456)
- Ketika homeroom teacher pilih 2024/2025 GENAP → Tidak menemukan Siswa A karena `student.classId` sekarang adalah `cls_456`, bukan `cls_123`

## ✅ Solusi yang Diterapkan

### 1. Update API `/homeroom/my-students` (Line 85-118)

Menambahkan logika untuk membedakan current year vs historical year:

```javascript
// Check if this is the current active academic year
const isCurrentYear = kelas.academicYear.isActive;

let students = [];

if (isCurrentYear) {
  // For current year, get students directly from classId
  students = await prisma.student.findMany({
    where: { classId: kelas.id },
    orderBy: { namaLengkap: "asc" },
  });
} else {
  // For historical years, use StudentClassHistory
  const studentHistories = await prisma.studentClassHistory.findMany({
    where: {
      classId: kelas.id,
      academicYearId: kelas.academicYear.id,
    },
    include: { student: true },
    orderBy: { student: { namaLengkap: "asc" } },
  });

  students = studentHistories.map((history) => history.student);
}
```

### 2. StudentClassHistory Population

Sistem sudah otomatis membuat record `StudentClassHistory` saat:

#### a. Proses Kenaikan Kelas oleh Homeroom Teacher
File: `app/api/homeroom/promote-students/route.js` (Line 292-300)

```javascript
await tx.studentClassHistory.create({
  data: {
    studentId: student.id,
    classId: currentClass.id,
    academicYearId: currentClass.academicYearId,
    naikKelas: naikKelas,
    nilaiAkhir: nilaiAkhir ? parseFloat(nilaiAkhir.toFixed(2)) : null,
  },
});
```

#### b. Proses Kenaikan Kelas oleh Admin
File: `app/api/admin/promote-students/process/route.js` (Line 81-87)

```javascript
prisma.studentClassHistory.create({
  data: {
    studentId: student.id,
    classId: student.classId,
    academicYearId: currentClass.academicYearId,
    naikKelas: true,
  },
});
```

## 🎯 Cara Kerja

### Untuk Tahun Ajaran Aktif (isActive: true)
1. Query langsung ke `student` table dengan `classId` matching
2. Data real-time dari siswa yang sedang aktif di kelas tersebut

### Untuk Tahun Ajaran Historical (isActive: false)
1. Query ke `StudentClassHistory` dengan `classId` dan `academicYearId`
2. Mendapatkan list siswa yang **pernah** belajar di kelas tersebut pada tahun ajaran tersebut
3. Include data student dari relation

## 📊 Data Flow

```
┌─────────────────────────────────────────────────┐
│  Homeroom Teacher Pilih Tahun Ajaran Lama      │
│  (misal: 2024/2025 GANJIL)                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  API: /homeroom/my-students                     │
│  Params: academicYearId = "acy_2024_ganjil"    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
         ┌───────┴────────┐
         │ isActive?      │
         └───┬────────┬───┘
             │        │
        YES  │        │  NO
             │        │
             ▼        ▼
    ┌────────────┐  ┌──────────────────────┐
    │  Query     │  │  Query               │
    │  Student   │  │  StudentClassHistory │
    │  WHERE     │  │  WHERE               │
    │  classId   │  │  classId AND         │
    │            │  │  academicYearId      │
    └────────────┘  └──────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Include Student │
                    │  Data            │
                    └──────────────────┘
```

## 🧪 Testing

### Test Case 1: Tahun Ajaran Aktif
1. Login sebagai homeroom teacher
2. Buka halaman Reports
3. Pilih tahun ajaran aktif (isActive: true)
4. **Expected:** Melihat semua siswa yang sedang aktif di kelas tersebut

### Test Case 2: Tahun Ajaran Historical
1. Login sebagai homeroom teacher
2. Buka halaman Reports
3. Pilih tahun ajaran lama (misal: 2024/2025 GANJIL)
4. **Expected:** Melihat semua siswa yang pernah belajar di kelas tersebut pada tahun ajaran tersebut (meskipun siswa sudah naik kelas)

### Test Case 3: Siswa yang Sudah Naik Kelas
1. Pastikan ada siswa yang sudah diproses naik kelas
2. Pilih tahun ajaran lama (sebelum naik kelas)
3. **Expected:** Siswa tersebut tetap muncul di list dengan data historical

### Test Case 4: Download Rapor Historical
1. Pilih tahun ajaran lama
2. Pilih siswa dari list
3. Download rapor (PDF/Excel)
4. **Expected:** Data nilai sesuai dengan tahun ajaran yang dipilih

## 🔐 Data Integrity

### StudentClassHistory Schema
```prisma
model StudentClassHistory {
  id             String  @id
  studentId      String
  classId        String
  academicYearId String
  naikKelas      Boolean @default(false)  // Apakah naik kelas
  nilaiAkhir     Float?                    // Rata-rata nilai
  createdAt      DateTime @default(now())

  student      Student      @relation(...)
  class        Class        @relation(...)
  academicYear AcademicYear @relation(...)

  @@unique([studentId, classId, academicYearId])
}
```

### Constraints
- Setiap siswa hanya punya 1 history per combination (studentId + classId + academicYearId)
- History otomatis dibuat saat proses kenaikan kelas
- Menyimpan informasi apakah siswa naik kelas atau mengulang

## 🎓 Use Cases

### 1. Laporan Presensi Historical
✅ Dapat melihat presensi siswa di tahun ajaran lama

### 2. Laporan Nilai Kelas Historical
✅ Dapat melihat rekap nilai seluruh siswa di tahun ajaran lama

### 3. Rapor Individual Historical
✅ Dapat download rapor siswa untuk tahun ajaran lama (meskipun siswa sudah naik kelas)

### 4. Audit Trail
✅ Menyimpan history perjalanan akademik siswa
✅ Tracking kenaikan kelas/mengulang
✅ History nilai akhir per tahun ajaran

## 📝 Notes

1. **StudentClassHistory** adalah source of truth untuk data historical
2. **student.classId** hanya menunjukkan kelas aktif saat ini
3. Setiap kali siswa naik kelas, history otomatis dibuat
4. History tidak bisa dihapus (untuk audit trail)
5. Nilai akhir di history adalah rata-rata dari semester GANJIL + GENAP

---

**Last Updated:** 2025-01-24
**Status:** ✅ Fixed & Production Ready
