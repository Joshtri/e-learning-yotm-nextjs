import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createUTSUASGenapForKelas11() {
  console.log("🌱 Creating UTS & UAS for Semester GENAP 2025/2026 - Kelas 11...\n");

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

  let utsCount = 0;
  let uasCount = 0;

  // ========== MATEMATIKA UTS ==========
  const matematika = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Matematika");
  if (matematika) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Matematika Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Tengah Semester Matematika - Materi Matriks, Determinan, dan Invers",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-15"),
        TanggalSelesai: new Date("2026-03-18"),
        nilaiMaksimal: 100,
        classSubjectTutorId: matematika.id,
        questions: {
          create: [
            {
              teks: "Diketahui matriks A = [[3, 2], [1, 4]] dan B = [[1, 5], [2, 3]]. Hitunglah A × B!",
              jenis: "ESSAY",
              poin: 20,
              pembahasan: "A × B = [[3×1+2×2, 3×5+2×3], [1×1+4×2, 1×5+4×3]] = [[7, 21], [9, 17]]",
            },
            {
              teks: "Tentukan determinan dari matriks C = [[5, 3], [2, 4]]!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "14",
              pembahasan: "det(C) = (5×4) - (3×2) = 20 - 6 = 14",
            },
            {
              teks: "Invers matriks hanya ada jika determinan matriks tersebut tidak sama dengan 0",
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
            {
              teks: "Tentukan invers dari matriks D = [[2, 1], [5, 3]]!",
              jenis: "ESSAY",
              poin: 20,
              pembahasan: "det(D) = 6-5 = 1, D⁻¹ = [[3, -1], [-5, 2]]",
            },
            {
              teks: "Jika matriks E berordo 2×3 dan matriks F berordo 3×2, maka hasil E × F berordo...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "2×2",
              options: {
                create: [
                  { teks: "2×2", adalahBenar: true, kode: "A" },
                  { teks: "3×3", adalahBenar: false, kode: "B" },
                  { teks: "2×3", adalahBenar: false, kode: "C" },
                  { teks: "3×2", adalahBenar: false, kode: "D" },
                ],
              },
            },
          ],
        },
      },
    });
    utsCount++;
    console.log("  ✓ Created UTS: Matematika");
  }

  // ========== MATEMATIKA UAS ==========
  if (matematika) {
    await prisma.assignment.create({
      data: {
        judul: "UAS Matematika Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Akhir Semester Matematika - Materi Matriks, Vektor, dan Transformasi Geometri",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2026-05-20"),
        TanggalSelesai: new Date("2026-05-25"),
        nilaiMaksimal: 100,
        classSubjectTutorId: matematika.id,
        questions: {
          create: [
            {
              teks: "Selesaikan sistem persamaan linear: 2x + 3y = 8 dan x - y = 1 menggunakan matriks!",
              jenis: "ESSAY",
              poin: 25,
              pembahasan: "Menggunakan metode eliminasi Gauss atau matriks invers",
            },
            {
              teks: "Vektor a = (3, 4) dan vektor b = (2, 1). Hitunglah a + 2b!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "(7, 6)",
              pembahasan: "a + 2b = (3, 4) + 2(2, 1) = (3, 4) + (4, 2) = (7, 6)",
            },
            {
              teks: "Tentukan bayangan titik A(3, 5) jika ditranslasikan oleh T = [[2], [-3]]!",
              jenis: "ESSAY",
              poin: 25,
              pembahasan: "A' = (3+2, 5+(-3)) = (5, 2)",
            },
            {
              teks: "Refleksi terhadap sumbu X akan mengubah koordinat (x, y) menjadi (x, -y)",
              jenis: "TRUE_FALSE",
              poin: 25,
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
    uasCount++;
    console.log("  ✓ Created UAS: Matematika");
  }

  // ========== BAHASA INDONESIA UTS ==========
  const bahasaIndonesia = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Indonesia");
  if (bahasaIndonesia) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Bahasa Indonesia Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Tengah Semester Bahasa Indonesia - Materi Cerpen dan Drama",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-16"),
        TanggalSelesai: new Date("2026-03-19"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaIndonesia.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara cerpen dan novel! Sebutkan minimal 3 perbedaan!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 5 unsur intrinsik dalam cerpen!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Tema, tokoh, alur, latar, amanat",
            },
            {
              teks: "Bacalah kutipan cerpen berikut, kemudian analisislah unsur intrinsik yang terdapat dalam kutipan tersebut!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Drama adalah karya sastra yang ditulis dalam bentuk dialog dan dipentaskan",
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
    utsCount++;
    console.log("  ✓ Created UTS: Bahasa Indonesia");
  }

  // ========== BAHASA INGGRIS UTS ==========
  const bahasaInggris = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Bahasa Inggris");
  if (bahasaInggris) {
    await prisma.assignment.create({
      data: {
        judul: "Midterm Exam English Grade 11 Even Semester 2026",
        deskripsi: "Midterm Exam - Narrative Text and Conditional Sentences",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-17"),
        TanggalSelesai: new Date("2026-03-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaInggris.id,
        questions: {
          create: [
            {
              teks: "Read the narrative text below and answer: What is the moral value of the story?",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Complete the sentence with the correct conditional: If I ... (be) you, I would study harder.",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "were",
            },
            {
              teks: "Make 3 conditional sentences Type 2 about your dreams!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Narrative text uses simple past tense",
              jenis: "TRUE_FALSE",
              poin: 20,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "True", adalahBenar: true, kode: "A" },
                  { teks: "False", adalahBenar: false, kode: "B" },
                ],
              },
            },
          ],
        },
      },
    });
    utsCount++;
    console.log("  ✓ Created UTS: Bahasa Inggris");
  }

  // ========== BAHASA INGGRIS UAS ==========
  if (bahasaInggris) {
    await prisma.assignment.create({
      data: {
        judul: "Final Exam English Grade 11 Even Semester 2026",
        deskripsi: "Final Exam - All Materials Even Semester",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2026-05-21"),
        TanggalSelesai: new Date("2026-05-26"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaInggris.id,
        questions: {
          create: [
            {
              teks: "Write a narrative text about your favorite Indonesian legend (minimum 150 words)! Don't forget to include: orientation, complication, resolution!",
              jenis: "ESSAY",
              poin: 40,
            },
            {
              teks: "Make 5 conditional sentences (mix Type 1 and Type 2) based on your daily life!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "What tense is commonly used in narrative text?",
              jenis: "SHORT_ANSWER",
              poin: 15,
              jawabanBenar: "Simple past tense",
            },
            {
              teks: "If I had studied harder, I ... (pass) the exam. (Type 3)",
              jenis: "SHORT_ANSWER",
              poin: 15,
              jawabanBenar: "would have passed",
            },
          ],
        },
      },
    });
    uasCount++;
    console.log("  ✓ Created UAS: Bahasa Inggris");
  }

  // ========== EKONOMI UTS ==========
  const ekonomi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Ekonomi Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Tengah Semester Ekonomi - Kebijakan Moneter dan Fiskal",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-18"),
        TanggalSelesai: new Date("2026-03-21"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara kebijakan moneter dan kebijakan fiskal!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 4 instrumen kebijakan moneter!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Operasi pasar terbuka, diskonto, rasio cadangan wajib, imbauan moral",
            },
            {
              teks: "Jika Bank Indonesia menaikkan suku bunga, apa dampaknya terhadap perekonomian?",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Kebijakan fiskal dikeluarkan oleh Bank Indonesia",
              jenis: "TRUE_FALSE",
              poin: 20,
              jawabanBenar: "false",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: false, kode: "A" },
                  { teks: "Salah", adalahBenar: true, kode: "B" },
                ],
              },
            },
          ],
        },
      },
    });
    utsCount++;
    console.log("  ✓ Created UTS: Ekonomi");
  }

  // ========== GEOGRAFI UTS ==========
  const geografi = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Geografi Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Tengah Semester Geografi - Mitigasi dan Adaptasi Bencana",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-19"),
        TanggalSelesai: new Date("2026-03-22"),
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara mitigasi dan adaptasi bencana! Berikan masing-masing 2 contoh!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 5 jenis bencana alam yang sering terjadi di Indonesia!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Gempa bumi, tsunami, gunung meletus, banjir, tanah longsor",
            },
            {
              teks: "Analisislah langkah-langkah mitigasi yang dapat dilakukan untuk mengurangi risiko bencana gempa bumi!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Early warning system termasuk mitigasi struktural",
              jenis: "TRUE_FALSE",
              poin: 20,
              jawabanBenar: "false",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: false, kode: "A" },
                  { teks: "Salah", adalahBenar: true, kode: "B" },
                ],
              },
            },
          ],
        },
      },
    });
    utsCount++;
    console.log("  ✓ Created UTS: Geografi");
  }

  // ========== SEJARAH UTS ==========
  const sejarah = kelas11GenapData.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Sejarah Kelas 11 Semester Genap 2026",
        deskripsi: "Ujian Tengah Semester Sejarah - Proklamasi Kemerdekaan Indonesia",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2026-03-20"),
        TanggalSelesai: new Date("2026-03-23"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Jelaskan kronologi peristiwa Rengasdengklok hingga proklamasi kemerdekaan!",
              jenis: "ESSAY",
              poin: 40,
            },
            {
              teks: "Siapa yang mengetik teks proklamasi?",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Sayuti Melik",
            },
            {
              teks: "Jelaskan makna proklamasi kemerdekaan bagi bangsa Indonesia!",
              jenis: "ESSAY",
              poin: 20,
            },
            {
              teks: "Proklamasi kemerdekaan Indonesia dilakukan di Jalan Pegangsaan Timur 56",
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
    utsCount++;
    console.log("  ✓ Created UTS: Sejarah");
  }

  console.log(`\n✅ Created ${utsCount} UTS and ${uasCount} UAS for Semester GENAP\n`);
}

async function main() {
  try {
    await createUTSUASGenapForKelas11();
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
