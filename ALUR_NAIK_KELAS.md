# 📚 Alur Naik Kelas - Dokumentasi Lengkap

## 🎯 Gambaran Umum

Sistem naik kelas dirancang untuk memproses kenaikan siswa dari satu tingkat ke tingkat berikutnya, atau mengulang di tingkat yang sama, dengan mempertimbangkan nilai semester GANJIL dan GENAP.

---

## 🔄 Alur Proses Lengkap

### **1. Persiapan oleh ADMIN**

Admin **HARUS** membuat kelas-kelas baru terlebih dahulu di tahun ajaran baru:

**Contoh:**
- Tahun Ajaran Saat Ini: **2025/2026 GENAP** (kelas XI IPA 1)
- Tahun Ajaran Baru: **2026/2027 GANJIL**

Admin membuat:
- ✅ **XII IPA 1** (2026/2027 GANJIL) - untuk siswa yang naik
- ✅ **XI IPA 1** (2026/2027 GANJIL) - untuk siswa yang mengulang (opsional)

**Catatan Penting:**
- Kelas harus dibuat di menu **Admin > Akademik > Kelas**
- Semester harus **GANJIL** (tahun ajaran baru selalu dimulai dari semester GANJIL)
- Program harus **sama** dengan kelas asal (IPA ke IPA, IPS ke IPS)

---

### **2. Proses oleh WALI KELAS**

#### **Langkah 1: Akses Menu**
- Menu: **Homeroom > Penilaian > Manajemen Naik Kelas**
- Hanya dapat diakses pada **semester GENAP**

#### **Langkah 2: Review Nilai Siswa**
Sistem menampilkan tabel dengan kolom:
- **Nilai Sem. Ganjil** (biru)
- **Nilai Sem. Genap** (ungu)
- **Trend** (↗️ naik, ↘️ turun, — tetap)
- **Nilai Total** (hijau, rata-rata gabungan)
- **Kehadiran** (persentase dari kedua semester)
- **Tombol Detail** - untuk melihat perbandingan per mata pelajaran

#### **Langkah 3: Tentukan Status Naik**
- Toggle **Status Naik** untuk setiap siswa
- ✅ ON = Naik kelas
- ❌ OFF = Tidak naik (mengulang)

#### **Langkah 4: Pilih Kelas Tujuan**

**A. Pilih Tahun Ajaran:**
```
2025/2026 - Semester GANJIL
```

**B. Pilih Kelas untuk Siswa yang NAIK:**
```
XI IPA 1 - IPA (0 siswa) - Wali: Pak Budi
```
**WAJIB dipilih!**

**C. Pilih Kelas untuk Siswa yang TIDAK NAIK (Opsional):**
```
X IPA 1 - IPA (0 siswa) - Wali: Bu Ani
```
- Jika dipilih: Siswa yang tidak naik akan dipindahkan ke kelas ini
- Jika tidak dipilih: Siswa akan tetap di kelas lama (2024/2025 GENAP)

#### **Langkah 5: Proses Kenaikan**
- Klik tombol **"Proses Kenaikan Kelas"**
- Sistem akan:
  1. Validasi kelengkapan nilai (UTS, UAS, Nilai Akhir dari semester GANJIL dan GENAP)
  2. Membuat `StudentClassHistory` dengan nilai gabungan
  3. Memindahkan siswa ke kelas tujuan
  4. Update status tahun ajaran (current jadi inactive, target jadi active)

---

## 📊 Perhitungan Nilai

### **Nilai yang Digunakan:**

1. **FinalScore Semester GANJIL**
   - Diambil dari tabel `FinalScore` dengan `tahunAjaranId` = GANJIL
   - Per mata pelajaran

2. **FinalScore Semester GENAP**
   - Diambil dari tabel `FinalScore` dengan `tahunAjaranId` = GENAP
   - Per mata pelajaran

3. **Nilai Total Gabungan**
   ```javascript
   nilaiTotal = (SUM(nilaiGANJIL) + SUM(nilaiGENAP)) / totalMapel
   ```
   - Semua nilai dari kedua semester digabung
   - Dihitung rata-ratanya
   - Disimpan di `StudentClassHistory.nilaiAkhir`

---

## 🗄️ Database Schema yang Terlibat

### **1. Student**
```prisma
model Student {
  id           String
  classId      String?        // Akan diupdate saat naik kelas
  naikKelas    Boolean        // Flag sementara dari wali kelas
  diprosesNaik Boolean        // Sudah diproses atau belum
  ...
}
```

### **2. Class**
```prisma
model Class {
  id             String
  namaKelas      String         // Contoh: "XI IPA 1"
  programId      String         // Harus sama dengan kelas asal
  academicYearId String         // Tahun ajaran BARU (2025/2026 GANJIL)
  homeroomTeacherId String?     // Wali kelas
  ...
}
```

### **3. StudentClassHistory**
```prisma
model StudentClassHistory {
  id             String
  studentId      String
  classId        String         // Kelas semester GENAP yang baru selesai
  academicYearId String         // Tahun ajaran GENAP yang baru selesai
  naikKelas      Boolean        // Apakah naik atau tidak
  nilaiAkhir     Float?         // Rata-rata nilai GANJIL + GENAP
  createdAt      DateTime
}
```

### **4. FinalScore**
```prisma
model FinalScore {
  id            String
  studentId     String
  subjectId     String
  nilaiAkhir    Float
  tahunAjaranId String         // GANJIL atau GENAP

  @@unique([studentId, subjectId, tahunAjaranId])
}
```

---

## ⚠️ Validasi dan Error Handling

### **Validasi Sebelum Proses:**

1. **Semester Validation**
   - ❌ Error jika diakses di semester GANJIL
   - ✅ Hanya bisa diakses di semester GENAP

2. **Target Academic Year Validation**
   - ❌ Target harus semester **GANJIL**
   - ❌ Target harus tahun ajaran **baru** (tidak boleh tahun lama)

3. **Kelas Tujuan Validation**
   - ❌ Kelas harus **sudah dibuat admin**
   - ❌ Kelas harus di tahun ajaran yang **sesuai**
   - ❌ Program kelas harus **sama** dengan kelas asal

4. **Nilai Validation**
   - ❌ Error jika FinalScore semester GANJIL belum lengkap
   - ❌ Error jika FinalScore semester GENAP belum lengkap
   - Menampilkan detail siswa dan mata pelajaran yang kurang

---

## 🎯 Skenario Penggunaan

### **Skenario 1: Semua Siswa Naik**
```
Kelas Saat Ini: X IPA 1 (2024/2025 GENAP)
- 30 siswa, semua naik kelas

Target:
- Kelas Naik: XI IPA 1 (2025/2026 GANJIL)
- Kelas Mengulang: (tidak dipilih)

Hasil:
✅ 30 siswa dipindahkan ke XI IPA 1
✅ History dibuat dengan naikKelas=true dan nilaiAkhir
```

### **Skenario 2: Ada Siswa yang Tidak Naik**
```
Kelas Saat Ini: X IPA 1 (2024/2025 GENAP)
- 30 siswa total
- 28 siswa naik
- 2 siswa tidak naik

Target:
- Kelas Naik: XI IPA 1 (2025/2026 GANJIL)
- Kelas Mengulang: X IPA 1 (2025/2026 GANJIL)

Hasil:
✅ 28 siswa dipindahkan ke XI IPA 1
✅ 2 siswa dipindahkan ke X IPA 1 (mengulang)
✅ History dibuat untuk semua siswa
```

### **Skenario 3: Tidak Ada Kelas Mengulang**
```
Kelas Saat Ini: X IPA 1 (2024/2025 GENAP)
- 30 siswa total
- 28 siswa naik
- 2 siswa tidak naik

Target:
- Kelas Naik: XI IPA 1 (2025/2026 GANJIL)
- Kelas Mengulang: (tidak dipilih)

Sistem akan konfirmasi:
⚠️ "Ada 2 siswa yang tidak naik tetapi belum pilih kelas mengulang.
    Siswa akan tetap di kelas lama. Lanjutkan?"

Hasil:
✅ 28 siswa dipindahkan ke XI IPA 1
⚠️ 2 siswa tetap di X IPA 1 (2024/2025 GENAP) - tahun ajaran sudah non-aktif
```

---

## 🔍 FAQ

### **Q: Apa yang terjadi jika admin belum membuat kelas tujuan?**
A: Sistem akan menampilkan alert merah "Belum ada kelas yang dibuat admin". Wali kelas harus menghubungi admin untuk membuat kelas terlebih dahulu.

### **Q: Apakah kelas dibuat otomatis oleh sistem?**
A: **TIDAK!** Kelas HARUS dibuat oleh admin terlebih dahulu. Ini untuk menghindari duplikasi dan memastikan struktur kelas terorganisir.

### **Q: Bagaimana jika nilai siswa belum lengkap?**
A: Sistem akan menolak proses dan menampilkan dialog error dengan detail:
- Nama siswa yang bermasalah
- Mata pelajaran yang nilainya belum ada
- Semester mana yang kurang (GANJIL/GENAP)

### **Q: Apakah bisa memproses naik kelas di semester GANJIL?**
A: **TIDAK!** Naik kelas hanya bisa diproses di semester GENAP karena membutuhkan nilai gabungan dari kedua semester (GANJIL + GENAP).

### **Q: Bagaimana dengan siswa yang pindah sekolah atau lulus?**
A: Siswa dengan status `TRANSFERRED` atau `GRADUATED` di field `Student.status` tidak akan muncul dalam daftar kenaikan kelas.

### **Q: Apakah wali kelas bisa mengubah keputusan setelah diproses?**
A: Tidak secara langsung melalui UI. Admin perlu mengubah manual di database atau membuat fitur reversal khusus.

---

## 🚀 Kesimpulan

**Alur yang Benar:**
1. ✅ Admin membuat kelas baru di tahun ajaran baru (semester GANJIL)
2. ✅ Wali kelas mengakses menu di semester GENAP
3. ✅ Wali kelas review nilai gabungan (GANJIL + GENAP)
4. ✅ Wali kelas tentukan status naik per siswa
5. ✅ Wali kelas pilih kelas tujuan dari dropdown (sudah dibuat admin)
6. ✅ Sistem validasi dan proses pemindahan
7. ✅ History tersimpan dengan nilai gabungan

**Yang SALAH:**
- ❌ Auto-create kelas oleh wali kelas
- ❌ Input manual nama kelas (rawan typo)
- ❌ Memproses naik kelas di semester GANJIL
- ❌ Siswa tidak naik tetap di kelas dengan tahun ajaran non-aktif

---

**Last Updated:** 2025-01-05
**Version:** 1.0
