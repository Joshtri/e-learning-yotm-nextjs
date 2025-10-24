import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createTugasGenapForKelas11() {
  console.log("🌱 Creating Tugas for Semester GENAP 2025/2026 - Kelas 11...\n");

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
    console.log("❌ No subjects found for Kelas 11 Semester GENAP");
    return;
  }

  let tugasCount = 0;

  // ========== MATEMATIKA ==========
  const matematika = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Matematika");
  if (matematika) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Matematika - Matriks dan Determinan",
        deskripsi: "Menyelesaikan soal-soal matriks dan determinan",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-02-10"),
        TanggalSelesai: new Date("2026-02-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: matematika.id,
        questions: {
          create: [
            {
              teks: "Diketahui matriks A = [[2, 3], [1, 4]] dan B = [[5, 6], [7, 8]]. Hitunglah A + B!",
              jenis: "ESSAY",
              poin: 25,
              pembahasan: "A + B = [[2+5, 3+6], [1+7, 4+8]] = [[7, 9], [8, 12]]",
            },
            {
              teks: "Tentukan determinan dari matriks C = [[3, 2], [1, 4]]!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "10",
              pembahasan: "det(C) = (3×4) - (2×1) = 12 - 2 = 10",
            },
            {
              teks: "Jika matriks D memiliki determinan = 0, maka matriks D memiliki invers",
              jenis: "TRUE_FALSE",
              poin: 25,
              jawabanBenar: "false",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: false, kode: "A" },
                  { teks: "Salah", adalahBenar: true, kode: "B" },
                ],
              },
            },
            {
              teks: "Hitunglah hasil perkalian matriks [[1, 2], [3, 4]] × [[2, 0], [1, 3]]!",
              jenis: "ESSAY",
              poin: 25,
              pembahasan: "Hasil = [[1×2+2×1, 1×0+2×3], [3×2+4×1, 3×0+4×3]] = [[4, 6], [10, 12]]",
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Matematika");
  }

  // ========== BAHASA INDONESIA ==========
  const bahasaIndonesia = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Indonesia");
  if (bahasaIndonesia) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Bahasa Indonesia - Menulis Cerpen",
        deskripsi: "Membuat cerpen dengan tema bebas minimal 1000 kata",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-02-15"),
        TanggalSelesai: new Date("2026-03-15"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaIndonesia.id,
        questions: {
          create: [
            {
              teks: "Buatlah cerpen dengan tema 'Persahabatan' minimal 1000 kata! Perhatikan struktur cerpen: orientasi, komplikasi, klimaks, resolusi, dan koda!",
              jenis: "ESSAY",
              poin: 70,
            },
            {
              teks: "Sebutkan dan jelaskan unsur intrinsik yang ada dalam cerpen yang kamu buat!",
              jenis: "ESSAY",
              poin: 30,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Bahasa Indonesia");
  }

  // ========== BAHASA INGGRIS ==========
  const bahasaInggris = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Inggris");
  if (bahasaInggris) {
    await prisma.assignment.create({
      data: {
        judul: "Assignment - Writing Narrative Text",
        deskripsi: "Write a narrative text about Indonesian legend",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-02-20"),
        TanggalSelesai: new Date("2026-03-05"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaInggris.id,
        questions: {
          create: [
            {
              teks: "Write a narrative text about one Indonesian legend (Malin Kundang, Tangkuban Perahu, or Bawang Merah Bawang Putih) in 200-250 words! Pay attention to the generic structure!",
              jenis: "ESSAY",
              poin: 60,
            },
            {
              teks: "What is the moral lesson from the legend you wrote?",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Varies based on the legend chosen",
            },
            {
              teks: "Make 5 conditional sentences (Type 1 or Type 2) based on the legend!",
              jenis: "ESSAY",
              poin: 20,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Bahasa Inggris");
  }

  // ========== EKONOMI ==========
  const ekonomi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Ekonomi - Analisis Kebijakan Moneter",
        deskripsi: "Menganalisis kebijakan moneter yang diterapkan di Indonesia",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-03-01"),
        TanggalSelesai: new Date("2026-03-15"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara kebijakan moneter ekspansif dan kontraktif! Berikan masing-masing 2 contoh!",
              jenis: "ESSAY",
              poin: 40,
            },
            {
              teks: "Sebutkan 4 instrumen kebijakan moneter yang digunakan Bank Indonesia!",
              jenis: "SHORT_ANSWER",
              poin: 30,
              jawabanBenar: "Operasi pasar terbuka, diskonto, rasio cadangan wajib, imbauan moral",
            },
            {
              teks: "Analisislah dampak kenaikan suku bunga terhadap perekonomian Indonesia!",
              jenis: "ESSAY",
              poin: 30,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Ekonomi");
  }

  // ========== GEOGRAFI ==========
  const geografi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Geografi - Mitigasi Bencana",
        deskripsi: "Membuat rencana mitigasi bencana untuk daerah sekitar",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-03-10"),
        TanggalSelesai: new Date("2026-04-10"),
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Buatlah peta rawan bencana untuk daerah tempat tinggalmu! Identifikasi jenis-jenis bencana yang mungkin terjadi!",
              jenis: "ESSAY",
              poin: 50,
            },
            {
              teks: "Sebutkan 5 langkah mitigasi bencana yang dapat dilakukan di daerahmu!",
              jenis: "SHORT_ANSWER",
              poin: 30,
              jawabanBenar: "Varies based on local conditions",
            },
            {
              teks: "Buatlah early warning system sederhana untuk salah satu jenis bencana di daerahmu!",
              jenis: "ESSAY",
              poin: 20,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Geografi");
  }

  // ========== SEJARAH ==========
  const sejarah = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Sejarah - Proklamasi Kemerdekaan",
        deskripsi: "Analisis peristiwa proklamasi kemerdekaan Indonesia",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-03-20"),
        TanggalSelesai: new Date("2026-04-05"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Jelaskan latar belakang terjadinya peristiwa Rengasdengklok!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan tokoh-tokoh yang terlibat dalam perumusan teks proklamasi!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Soekarno, Hatta, Ahmad Soebardjo, Sayuti Melik",
            },
            {
              teks: "Jelaskan makna proklamasi bagi bangsa Indonesia!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Proklamasi kemerdekaan Indonesia dibacakan oleh Ir. Soekarno pada tanggal 17 Agustus 1945",
              jenis: "TRUE_FALSE",
              poin: 20,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: true, kode: "A" },
                  { teks: "Salah", adalahBenar: false, kode: "B" },
                ],
              },
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Sejarah");
  }

  // ========== SOSIOLOGI ==========
  const sosiologi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Sosiologi");
  if (sosiologi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Sosiologi - Penelitian Konflik Sosial",
        deskripsi: "Melakukan penelitian sederhana tentang konflik sosial di masyarakat",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-04-01"),
        TanggalSelesai: new Date("2026-04-30"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sosiologi.id,
        questions: {
          create: [
            {
              teks: "Identifikasi satu kasus konflik sosial yang terjadi di lingkungan sekitarmu! Analisis penyebab, dampak, dan cara penyelesaiannya!",
              jenis: "ESSAY",
              poin: 60,
            },
            {
              teks: "Sebutkan 3 bentuk integrasi sosial yang ada di masyarakat!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Asimilasi, akulturasi, amalgamasi",
            },
            {
              teks: "Buatlah usulan solusi untuk mengatasi konflik yang kamu analisis!",
              jenis: "ESSAY",
              poin: 20,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Sosiologi");
  }

  // ========== SENI BUDAYA ==========
  const seniBudaya = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Seni Budaya");
  if (seniBudaya) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Seni Budaya - Apresiasi Seni Musik Nusantara",
        deskripsi: "Membuat karya apresiasi tentang musik tradisional Nusantara",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2026-03-15"),
        TanggalSelesai: new Date("2026-04-15"),
        nilaiMaksimal: 100,
        classSubjectTutorId: seniBudaya.id,
        questions: {
          create: [
            {
              teks: "Pilih satu alat musik tradisional Nusantara! Jelaskan sejarah, cara memainkan, dan fungsinya dalam masyarakat!",
              jenis: "ESSAY",
              poin: 50,
            },
            {
              teks: "Sebutkan 5 alat musik tradisional Indonesia beserta asal daerahnya!",
              jenis: "SHORT_ANSWER",
              poin: 30,
              jawabanBenar: "Varies: Angklung (Jawa Barat), Sasando (NTT), Gambus (Riau), dll",
            },
            {
              teks: "Buatlah analisis tentang persamaan dan perbedaan musik tradisional dari 2 daerah yang berbeda!",
              jenis: "ESSAY",
              poin: 20,
            },
          ],
        },
      },
    });
    tugasCount++;
    console.log("  ✓ Created tugas: Seni Budaya");
  }

  console.log(`\n✅ Created total ${tugasCount} tugas for Semester GENAP\n`);
}

async function main() {
  try {
    await createTugasGenapForKelas11();
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
