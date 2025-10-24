import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createMateriGenapForKelas11() {
  console.log("🌱 Creating Materi Pembelajaran for Semester GENAP 2025/2026 - Kelas 11...\n");

  // Get Kelas 11 with GENAP academic year
  const kelas11GenapData = await prisma.classSubjectTutor.findMany({
    where: {
      class: {
        namaKelas: "Kelas 11",
        academicYear: {
          tahunMulai: 2025,
          tahunSelesai: 2026,
          semester: "GENAP",
        },
      },
    },
    include: {
      tutor: { include: { user: true } },
      class: { include: { program: true, academicYear: true } },
      subject: true,
    },
  });

  console.log(`Found ${kelas11GenapData.length} subjects for Kelas 11 Semester GENAP\n`);

  if (kelas11GenapData.length === 0) {
    console.log("❌ No subjects found for Kelas 11 Semester GENAP. Please make sure the class exists in the GENAP academic year.");
    return;
  }

  let materiCount = 0;

  // ========== MATEMATIKA ==========
  const matematika = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Matematika");
  if (matematika) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Matriks dan Operasi Matriks",
        pertemuan: "1",
        konten: `# Matriks dan Operasi Matriks

## Pengertian Matriks
Matriks adalah susunan bilangan yang disusun dalam baris dan kolom berbentuk persegi panjang.

## Jenis-jenis Matriks
1. **Matriks Baris**: Matriks yang hanya memiliki satu baris
2. **Matriks Kolom**: Matriks yang hanya memiliki satu kolom
3. **Matriks Persegi**: Matriks yang jumlah baris = jumlah kolom
4. **Matriks Identitas**: Matriks persegi dengan diagonal utama = 1

## Operasi Matriks
### Penjumlahan dan Pengurangan
- Hanya dapat dilakukan pada matriks yang berordo sama
- Dilakukan dengan menjumlahkan/mengurangkan elemen yang seletak

### Perkalian Matriks
- Matriks A(m×n) × B(n×p) = C(m×p)
- Syarat: Jumlah kolom A = Jumlah baris B

Video pembelajaran: https://www.youtube.com/watch?v=example_matriks`,
        tipeMateri: "LINK_YOUTUBE",
        fileUrl: "https://www.youtube.com/watch?v=example_matriks",
        classSubjectTutorId: matematika.id,
      },
    });
    
    await prisma.learningMaterial.create({
      data: {
        judul: "Determinan dan Invers Matriks",
        pertemuan: "2",
        konten: `# Determinan dan Invers Matriks

## Determinan Matriks
Determinan adalah nilai skalar yang dapat dihitung dari elemen-elemen matriks persegi.

### Determinan Matriks 2×2
det(A) = ad - bc

### Determinan Matriks 3×3
Menggunakan metode Sarrus atau ekspansi kofaktor

## Invers Matriks
Invers matriks A adalah matriks A⁻¹ yang memenuhi: A × A⁻¹ = I

### Syarat Matriks Memiliki Invers
- Matriks harus persegi
- Determinan ≠ 0

### Rumus Invers Matriks 2×2
A⁻¹ = (1/det(A)) × adj(A)`,
        tipeMateri: "FILE",
        classSubjectTutorId: matematika.id,
      },
    });
    materiCount += 2;
    console.log("  ✓ Created 2 materi: Matematika");
  }

  // ========== BAHASA INDONESIA ==========
  const bahasaIndonesia = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Indonesia");
  if (bahasaIndonesia) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Teks Cerita Pendek (Cerpen)",
        pertemuan: "1",
        konten: `# Teks Cerita Pendek (Cerpen)

## Pengertian Cerpen
Cerita pendek adalah karya sastra berbentuk prosa naratif fiktif yang relatif singkat.

## Ciri-ciri Cerpen
1. Cerita lebih pendek dari novel
2. Jumlah kata kurang dari 10.000 kata
3. Dapat dibaca sekali duduk
4. Memiliki satu alur cerita
5. Fokus pada satu tokoh utama

## Struktur Cerpen
1. **Orientasi**: Pengenalan tokoh, latar, dan situasi
2. **Komplikasi**: Munculnya konflik
3. **Klimaks**: Puncak konflik
4. **Resolusi**: Penyelesaian masalah
5. **Koda**: Pesan moral (opsional)

## Unsur Intrinsik Cerpen
- Tema
- Tokoh dan Penokohan
- Alur
- Latar (Setting)
- Sudut Pandang
- Amanat`,
        tipeMateri: "FILE",
        classSubjectTutorId: bahasaIndonesia.id,
      },
    });

    await prisma.learningMaterial.create({
      data: {
        judul: "Menulis Cerpen",
        pertemuan: "2",
        konten: `# Menulis Cerpen

## Langkah-langkah Menulis Cerpen
1. **Tentukan Tema**: Pilih tema yang menarik dan relevan
2. **Buat Kerangka**: Outline cerita dari awal hingga akhir
3. **Tentukan Tokoh**: Ciptakan karakter yang kuat
4. **Tentukan Latar**: Waktu dan tempat kejadian
5. **Kembangkan Alur**: Bangun konflik yang menarik
6. **Tulis Draf**: Tuangkan ide dalam tulisan
7. **Revisi**: Perbaiki dan sempurnakan

## Tips Menulis Cerpen yang Baik
- Gunakan kalimat efektif
- Hindari deskripsi yang terlalu panjang
- Buat dialog yang natural
- Gunakan majas dan gaya bahasa
- Buat ending yang mengejutkan atau bermakna`,
        tipeMateri: "FILE",
        classSubjectTutorId: bahasaIndonesia.id,
      },
    });
    materiCount += 2;
    console.log("  ✓ Created 2 materi: Bahasa Indonesia");
  }

  // ========== BAHASA INGGRIS ==========
  const bahasaInggris = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Inggris");
  if (bahasaInggris) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Narrative Text - Legends and Folktales",
        pertemuan: "1",
        konten: `# Narrative Text - Legends and Folktales

## Definition
Narrative text is a story with a sequence of events that tell a story to entertain readers.

## Social Function
To entertain and sometimes to teach moral lessons

## Generic Structure
1. **Orientation**: Introduction of characters, setting, and time
2. **Complication**: The problem or conflict
3. **Resolution**: Solution to the problem
4. **Re-orientation**: Optional ending remarks

## Language Features
- Past tense (Simple past, past continuous, past perfect)
- Time connectives (once upon a time, one day, after that)
- Action verbs (went, killed, saved)
- Direct and indirect speech
- Adjectives for describing characters

## Examples of Narrative Texts
- Legends (Malin Kundang, Tangkuban Perahu)
- Folktales
- Fairy tales
- Fables`,
        tipeMateri: "FILE",
        classSubjectTutorId: bahasaInggris.id,
      },
    });

    await prisma.learningMaterial.create({
      data: {
        judul: "Conditional Sentences - Type 1 and 2",
        pertemuan: "2",
        konten: `# Conditional Sentences

## Type 1 - Real Condition (Possible)
Used for real and possible situations in the present or future.

**Formula**: If + Simple Present, Will + V1

**Examples**:
- If it rains, I will stay at home.
- If you study hard, you will pass the exam.

## Type 2 - Unreal Condition (Impossible)
Used for unreal or impossible situations in the present or future.

**Formula**: If + Simple Past, Would + V1

**Examples**:
- If I were rich, I would buy a big house.
- If I had wings, I would fly to the moon.

**Note**: Use "were" for all subjects in Type 2

Video tutorial: https://www.youtube.com/watch?v=example_conditional`,
        tipeMateri: "LINK_YOUTUBE",
        fileUrl: "https://www.youtube.com/watch?v=example_conditional",
        classSubjectTutorId: bahasaInggris.id,
      },
    });
    materiCount += 2;
    console.log("  ✓ Created 2 materi: Bahasa Inggris");
  }

  // ========== EKONOMI ==========
  const ekonomi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Kebijakan Moneter dan Fiskal",
        pertemuan: "1",
        konten: `# Kebijakan Moneter dan Fiskal

## Kebijakan Moneter
Kebijakan yang dikeluarkan oleh Bank Sentral untuk mengatur jumlah uang beredar.

### Instrumen Kebijakan Moneter
1. **Operasi Pasar Terbuka**: Jual-beli surat berharga
2. **Diskonto**: Mengubah tingkat suku bunga
3. **Rasio Cadangan Wajib**: Mengatur simpanan minimum bank
4. **Imbauan Moral**: Himbauan kepada pelaku ekonomi

## Kebijakan Fiskal
Kebijakan yang dikeluarkan pemerintah terkait penerimaan dan pengeluaran negara.

### Instrumen Kebijakan Fiskal
1. **Pajak**: Penerimaan dari masyarakat
2. **Pengeluaran Pemerintah**: Belanja negara untuk pembangunan
3. **Anggaran**: APBN (Anggaran Pendapatan dan Belanja Negara)

## Tujuan
- Menstabilkan harga
- Meningkatkan pertumbuhan ekonomi
- Mengurangi pengangguran
- Menjaga keseimbangan neraca pembayaran`,
        tipeMateri: "FILE",
        classSubjectTutorId: ekonomi.id,
      },
    });
    materiCount += 1;
    console.log("  ✓ Created 1 materi: Ekonomi");
  }

  // ========== GEOGRAFI ==========
  const geografi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Mitigasi dan Adaptasi Bencana",
        pertemuan: "1",
        konten: `# Mitigasi dan Adaptasi Bencana

## Pengertian Bencana
Bencana adalah peristiwa atau rangkaian peristiwa yang mengancam dan mengganggu kehidupan masyarakat.

## Jenis-jenis Bencana
### Bencana Alam
- Gempa bumi
- Tsunami
- Gunung meletus
- Banjir
- Tanah longsor

### Bencana Non-Alam
- Wabah penyakit
- Kegagalan teknologi
- Epidemi

## Mitigasi Bencana
Upaya untuk mengurangi risiko bencana melalui pembangunan fisik maupun penyadaran dan peningkatan kemampuan menghadapi ancaman bencana.

### Jenis Mitigasi
1. **Mitigasi Struktural**: Pembangunan infrastruktur (tanggul, bendungan)
2. **Mitigasi Non-Struktural**: Penyuluhan, pelatihan, early warning system

## Adaptasi Bencana
Penyesuaian diri terhadap risiko bencana yang ada.

### Contoh Adaptasi
- Membangun rumah tahan gempa
- Tidak membangun di bantaran sungai
- Menyiapkan tas siaga bencana`,
        tipeMateri: "FILE",
        classSubjectTutorId: geografi.id,
      },
    });
    materiCount += 1;
    console.log("  ✓ Created 1 materi: Geografi");
  }

  // ========== SEJARAH ==========
  const sejarah = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Proklamasi Kemerdekaan Indonesia",
        pertemuan: "1",
        konten: `# Proklamasi Kemerdekaan Indonesia

## Latar Belakang
Setelah Jepang menyerah kepada Sekutu pada 15 Agustus 1945, Indonesia memiliki kesempatan untuk memproklamasikan kemerdekaannya.

## Peristiwa Rengasdengklok
- Tanggal: 16 Agustus 1945
- Para pemuda menculik Soekarno-Hatta ke Rengasdengklok
- Tujuan: Agar memproklamasikan kemerdekaan tanpa pengaruh Jepang

## Proklamasi
- **Tanggal**: 17 Agustus 1945
- **Tempat**: Jalan Pegangsaan Timur 56, Jakarta
- **Waktu**: Pukul 10.00 WIB
- **Pembacaan**: Ir. Soekarno
- **Pengetikan Teks**: Sayuti Melik
- **Penulis Teks**: Soekarno-Hatta

## Teks Proklamasi
"Kami bangsa Indonesia dengan ini menjatakan kemerdekaan Indonesia.
Hal-hal jang mengenai pemindahan kekoeasaan d.l.l., diselenggarakan dengan tjara seksama dan dalam tempo jang sesingkat-singkatnja.

Djakarta, hari 17 boelan 8 tahoen 05

Atas nama bangsa Indonesia,
Soekarno/Hatta"

## Makna Proklamasi
- Titik kulminasi perjuangan bangsa Indonesia
- Puncak perjuangan rakyat Indonesia
- Pengakuan kedaulatan bangsa Indonesia`,
        tipeMateri: "FILE",
        classSubjectTutorId: sejarah.id,
      },
    });
    materiCount += 1;
    console.log("  ✓ Created 1 materi: Sejarah");
  }

  // ========== SOSIOLOGI ==========
  const sosiologi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Sosiologi");
  if (sosiologi) {
    await prisma.learningMaterial.create({
      data: {
        judul: "Konflik Sosial dan Integrasi Sosial",
        pertemuan: "1",
        konten: `# Konflik Sosial dan Integrasi Sosial

## Konflik Sosial
Konflik adalah pertentangan yang terjadi antara individu atau kelompok dalam masyarakat.

### Penyebab Konflik
1. Perbedaan kepentingan
2. Perbedaan budaya
3. Perbedaan pendapat
4. Perubahan sosial yang cepat

### Dampak Konflik
**Positif**:
- Mendorong perubahan sosial
- Meningkatkan solidaritas dalam kelompok

**Negatif**:
- Kerusakan
- Perpecahan
- Korban jiwa

## Integrasi Sosial
Proses penyesuaian unsur-unsur yang berbeda dalam masyarakat sehingga menjadi satu kesatuan.

### Syarat Integrasi Sosial
1. Anggota masyarakat merasa berhasil saling mengisi kebutuhan
2. Tercapainya konsensus tentang nilai dan norma
3. Norma berlaku cukup lama dan konsisten

### Bentuk Integrasi
- Asimilasi: Pembauran budaya
- Akulturasi: Penerimaan unsur budaya baru
- Amalgamasi: Percampuran ras`,
        tipeMateri: "FILE",
        classSubjectTutorId: sosiologi.id,
      },
    });
    materiCount += 1;
    console.log("  ✓ Created 1 materi: Sosiologi");
  }

  console.log(`\n✅ Created total ${materiCount} materi pembelajaran for Semester GENAP\n`);
}

async function main() {
  try {
    await createMateriGenapForKelas11();
  } catch (error) {
    console.error("❌ Error during seeding:");
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
