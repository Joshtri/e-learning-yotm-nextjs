import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createTugasForAllSubjects() {
  console.log("🌱 Creating tugas (assignments) for all subjects...\n");

  const kelas11Data = await prisma.classSubjectTutor.findMany({
    where: {
      class: {
        namaKelas: "Kelas 11",
      },
    },
    include: {
      tutor: { include: { user: true } },
      class: { include: { program: true, academicYear: true } },
      subject: true,
    },
  });

  console.log(`Found ${kelas11Data.length} subjects for Kelas 11\n`);

  // Tugas Ekonomi
  const ekonomi = kelas11Data.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Ekonomi - Sistem Ekonomi",
        deskripsi: "Analisis perbandingan sistem ekonomi di berbagai negara",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-18"),
        TanggalSelesai: new Date("2025-11-28"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Bandingkan sistem ekonomi kapitalis, sosialis, dan campuran! Jelaskan kelebihan dan kekurangan masing-masing!",
              jenis: "ESSAY",
              poin: 60,
            },
            {
              teks: "Sebutkan negara yang menerapkan sistem ekonomi campuran!",
              jenis: "SHORT_ANSWER",
              poin: 40,
              jawabanBenar: "Indonesia, Malaysia, Singapura, dll",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Ekonomi");
  }

  // Tugas Geografi
  const geografi = kelas11Data.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Geografi - Peta dan Penginderaan Jauh",
        deskripsi: "Menganalisis peta topografi dan citra satelit",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-20"),
        TanggalSelesai: new Date("2025-12-01"),
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara peta topografi dan peta tematik! Berikan masing-masing 2 contoh!",
              jenis: "ESSAY",
              poin: 50,
            },
            {
              teks: "Sebutkan 3 manfaat penginderaan jauh dalam kehidupan sehari-hari!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Prediksi cuaca, pemantauan bencana, pemetaan wilayah",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Geografi");
  }

  // Tugas Sejarah
  const sejarah = kelas11Data.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Sejarah - Pergerakan Nasional Indonesia",
        deskripsi: "Analisis organisasi pergerakan nasional Indonesia",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-22"),
        TanggalSelesai: new Date("2025-12-03"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Jelaskan peran Budi Utomo dalam pergerakan nasional Indonesia!",
              jenis: "ESSAY",
              poin: 50,
            },
            {
              teks: "Sebutkan 3 organisasi pergerakan nasional selain Budi Utomo!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Sarekat Islam, Indische Partij, Perhimpunan Indonesia",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Sejarah");
  }

  // Tugas Sosiologi
  const sosiologi = kelas11Data.find((cst) => cst.subject.namaMapel === "Sosiologi");
  if (sosiologi) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Sosiologi - Penelitian Sosial Sederhana",
        deskripsi: "Melakukan observasi dan wawancara tentang interaksi sosial di lingkungan sekitar",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-24"),
        TanggalSelesai: new Date("2025-12-05"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sosiologi.id,
        questions: {
          create: [
            {
              teks: "Lakukan observasi tentang bentuk-bentuk interaksi sosial di lingkungan sekolah! Buat laporan minimal 3 halaman dengan metodologi yang jelas!",
              jenis: "ESSAY",
              poin: 100,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Sosiologi");
  }

  // Tugas Seni Budaya
  const seniBudaya = kelas11Data.find((cst) => cst.subject.namaMapel === "Seni Budaya");
  if (seniBudaya) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Seni Budaya - Karya Seni Rupa 2 Dimensi",
        deskripsi: "Membuat karya seni rupa 2 dimensi dengan tema bebas",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-26"),
        TanggalSelesai: new Date("2025-12-07"),
        nilaiMaksimal: 100,
        classSubjectTutorId: seniBudaya.id,
        questions: {
          create: [
            {
              teks: "Buatlah 1 karya seni rupa 2 dimensi (lukisan, gambar, atau kolase) dengan tema 'Keindahan Alam Indonesia'! Sertakan deskripsi tentang konsep dan teknik yang digunakan!",
              jenis: "ESSAY",
              poin: 100,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Seni Budaya");
  }

  // Tugas Pendidikan Agama
  const pendidikanAgama = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Agama");
  if (pendidikanAgama) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas Pendidikan Agama - Akhlak Mulia",
        deskripsi: "Menganalisis penerapan akhlak mulia dalam kehidupan sehari-hari",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-28"),
        TanggalSelesai: new Date("2025-12-09"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pendidikanAgama.id,
        questions: {
          create: [
            {
              teks: "Jelaskan 5 contoh penerapan akhlak mulia dalam kehidupan sehari-hari dan manfaatnya bagi diri sendiri dan orang lain!",
              jenis: "ESSAY",
              poin: 60,
            },
            {
              teks: "Sebutkan 3 sifat terpuji yang harus dimiliki seorang muslim!",
              jenis: "SHORT_ANSWER",
              poin: 40,
              jawabanBenar: "Jujur, amanah, sabar",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: Pendidikan Agama");
  }

  // Tugas PKn
  const pkn = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Kewarganegaraan");
  if (pkn) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas PKn - HAM di Indonesia",
        deskripsi: "Menganalisis implementasi Hak Asasi Manusia di Indonesia",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-11-30"),
        TanggalSelesai: new Date("2025-12-11"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pkn.id,
        questions: {
          create: [
            {
              teks: "Jelaskan apa yang dimaksud dengan HAM dan sebutkan contoh penerapannya di Indonesia!",
              jenis: "ESSAY",
              poin: 60,
            },
            {
              teks: "Sebutkan 3 macam HAM menurut jenisnya!",
              jenis: "SHORT_ANSWER",
              poin: 40,
              jawabanBenar: "HAM sipil dan politik, HAM ekonomi sosial budaya, HAM pembangunan",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: PKn");
  }

  // Tugas PJOK
  const pjok = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Jasmani, Olahraga, dan Kesehatan");
  if (pjok) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas PJOK - Kebugaran Jasmani",
        deskripsi: "Membuat program latihan kebugaran jasmani",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-12-02"),
        TanggalSelesai: new Date("2025-12-13"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pjok.id,
        questions: {
          create: [
            {
              teks: "Buatlah program latihan kebugaran jasmani untuk 1 minggu yang meliputi latihan kekuatan, daya tahan, dan fleksibilitas!",
              jenis: "ESSAY",
              poin: 70,
            },
            {
              teks: "Sebutkan 3 manfaat melakukan olahraga secara teratur!",
              jenis: "SHORT_ANSWER",
              poin: 30,
              jawabanBenar: "Meningkatkan kesehatan, menjaga berat badan, mengurangi stress",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: PJOK");
  }

  // Tugas TIK
  const tik = kelas11Data.find((cst) => cst.subject.namaMapel === "Teknologi Informasi dan Komunikasi");
  if (tik) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas TIK - Presentasi Multimedia",
        deskripsi: "Membuat presentasi multimedia menggunakan PowerPoint atau Google Slides",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-12-04"),
        TanggalSelesai: new Date("2025-12-15"),
        nilaiMaksimal: 100,
        classSubjectTutorId: tik.id,
        questions: {
          create: [
            {
              teks: "Buatlah presentasi multimedia dengan tema 'Perkembangan Teknologi di Era Digital' minimal 10 slide dengan desain yang menarik!",
              jenis: "ESSAY",
              poin: 100,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: TIK");
  }

  // Tugas IPA
  const ipa = kelas11Data.find((cst) => cst.subject.namaMapel === "Ilmu Pengetahuan Alam");
  if (ipa) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas IPA - Laporan Praktikum",
        deskripsi: "Membuat laporan praktikum tentang fotosintesis",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-12-06"),
        TanggalSelesai: new Date("2025-12-17"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ipa.id,
        questions: {
          create: [
            {
              teks: "Buatlah laporan praktikum lengkap tentang percobaan fotosintesis dengan metode Ingenhousz! Sertakan tujuan, alat dan bahan, prosedur, hasil pengamatan, pembahasan, dan kesimpulan!",
              jenis: "ESSAY",
              poin: 100,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: IPA");
  }

  // Tugas IPS
  const ips = kelas11Data.find((cst) => cst.subject.namaMapel === "Ilmu Pengetahuan Sosial");
  if (ips) {
    await prisma.assignment.create({
      data: {
        judul: "Tugas IPS - Kerjasama Internasional",
        deskripsi: "Menganalisis bentuk kerjasama internasional yang dilakukan Indonesia",
        jenis: "EXERCISE",
        TanggalMulai: new Date("2025-12-08"),
        TanggalSelesai: new Date("2025-12-19"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ips.id,
        questions: {
          create: [
            {
              teks: "Jelaskan 3 bentuk kerjasama internasional yang dilakukan Indonesia di bidang ekonomi, politik, dan sosial budaya!",
              jenis: "ESSAY",
              poin: 70,
            },
            {
              teks: "Sebutkan 3 organisasi internasional yang diikuti Indonesia!",
              jenis: "SHORT_ANSWER",
              poin: 30,
              jawabanBenar: "PBB, ASEAN, OKI",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created tugas: IPS");
  }

  console.log("\n✅ All tugas created successfully!\n");
}

createTugasForAllSubjects()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
