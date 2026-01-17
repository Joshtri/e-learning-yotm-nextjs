# Dokumentasi Rumus & Logika Perhitungan Aplikasi E-Learning

Dokumen ini menjelaskan logika perhitungan dan rumus yang digunakan dalam sistem untuk Presensi, Nilai Kelas, Penilaian Kuis, Nilai Mata Pelajaran, dan Nilai Sikap/Perilaku.

## 1. Presensi (Attendance)

Sistem menggunakan konsep **Kehadiran Harian** yang dihitung dari kumpulan sesi (`AttendanceSession`) pada hari yang sama.

### a. Logika Penentuan Status Harian

Jika dalam satu hari terdapat beberapa sesi pelajaran dengan status yang berbeda, status harian ditentukan berdasarkan prioritas berikut:

1. **ABSENT (Alpha)** - Prioritas Tertinggi (Jika ada 1 saja sesi Alpha, dianggap Alpha seharian)
2. **SICK (Sakit)**
3. **EXCUSED (Izin)**
4. **PRESENT (Hadir)** - Prioritas Terendah

### b. Perhitungan Skor Kehadiran (`BehaviorScore.kehadiran`)

Skor kehadiran dihitung berdasarkan bobot status harian, bukan sekadar jumlah hadir.

**Bobot Status:**

- `PRESENT`: 100 poin
- `SICK`: 75 poin
- `EXCUSED`: 50 poin
- `ABSENT`: 0 poin

**Rumus:**

```javascript
Total Poin = Sum(Bobot Status Harian)
Jumlah Hari = Total hari efektif belajar

Skor Kehadiran = Total Poin / Jumlah Hari
```

_Hasil skor ini (skala 0-100) otomatis masuk ke komponen nilai sikap._

---

## 2. Rekap Nilai Kelas (Class Scores)

Nilai rata-rata siswa dalam satu kelas dihitung berdasarkan nilai akhir yang tersimpan di database (`FinalScore`).

**Logika Pengambilan Data:**

1. Sistem mencari data siswa berdasarkan **Riwayat Kelas** (`StudentClassHistory`) untuk memastikan siswa yang ditampilkan adalah siswa yang benar-benar ada di kelas tersebut pada Tahun Ajaran yang dipilih.
2. Jika data riwayat tidak ditemukan (misal semester sedang berjalan), sistem menggunakan data siswa aktif (`Student`) saat ini.

**Rumus Rata-rata:**

```javascript
Total Score = Sum(Nilai Akhir setiap Mapel)
Subject Count = Jumlah Mapel yang memiliki nilai

Rata-rata = Total Score / Subject Count
```

_Hasil dibulatkan 2 angka di belakang koma (`toFixed(2)`)_.

---

## 3. Penilaian Kuis Otomatis (Auto-Grading)

Sistem melakukan penilaian otomatis saat siswa mengumpulkan (`submit`) kuis, khusus untuk tipe soal pilihan ganda atau isian singkat.

**Logika Penilaian:**

1. **Looping** setiap pertanyaan dalam kuis.
2. **Pencocokan Jawaban**:
   - Sistem membandingkan jawaban siswa dengan kunci jawaban.
   - Perbandingan bersifat _case-insensitive_ (huruf besar/kecil dianggap sama) dan mengabaikan spasi di awal/akhir (`trim()`).
   - `isCorrect = studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()`
3. **Pemberian Poin**:
   - Jika `isCorrect` bernilai `true`, maka `Nilai Soal = Poin Soal`.
   - Jika `false`, maka `Nilai Soal = 0`.
4. **Total Nilai**:
   ```javascript
   Total Nilai = Sum(Nilai setiap Soal)
   ```

_Catatan: Soal tipe ESSAY tidak dinilai otomatis dan memerlukan penilaian manual oleh Guru/Tutor._

---

## 4. Perhitungan Nilai Akhir (Recalculate Final Scores)

Fitur ini digunakan oleh Wali Kelas (Homeroom) untuk menghitung ulang nilai akhir siswa berdasarkan komponen nilai yang ada. Saat ini, sistem menggunakan **Nilai Keterampilan/Praktik** sebagai komponen utama.

**Logika:**

1. Ambil semua `SkillScore` milik siswa untuk setiap mata pelajaran.
2. Filter nilai yang valid (tidak null).
3. **Rumus Rata-rata**:
   ```javascript
   Nilai Akhir = Sum(Nilai Skill) / Jumlah Nilai Skill
   ```
4. Nilai ini kemudian disimpan ke tabel `FinalScore` (per mapel) dan `StudentClassHistory` (rata-rata umum).

---

## 5. Laporan Nilai Mata Pelajaran

Laporan ini menampilkan daftar nilai tugas, kuis, dan nilai akhir untuk satu mata pelajaran spesifik.

**Data yang Ditampilkan:**

- **Nilai Tugas/Kuis**: Diambil langsung dari tabel `Submission` berdasarkan `assignmentId`.
- **Nilai Akhir**: Diambil langsung dari tabel `FinalScore`.

_Jika nilai belum tersedia, laporan akan menampilkan tanda strip (`-`)._

---

## 6. Kenaikan Kelas (Semester Genap)

Logika kenaikan kelas ditentukan oleh Wali Kelas pada akhir Semester Genap. Data ini disimpan di `Student` dan `StudentClassHistory`.

- `naikKelas`: Boolean (true/false)
- `nilaiAkhir`: Rata-rata dari seluruh mata pelajaran.
