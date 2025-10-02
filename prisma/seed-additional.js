import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function createAdditionalQuizzes() {
  console.log("🌱 Creating additional quizzes for all subjects...\n");

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

  // Quiz Ekonomi
  const ekonomi = kelas11Data.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Ekonomi - Konsep Dasar Ekonomi",
        deskripsi: "Kuis tentang kebutuhan, kelangkaan, dan masalah ekonomi",
        waktuMulai: new Date("2025-11-10T08:00:00"),
        waktuSelesai: new Date("2025-11-10T09:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Masalah ekonomi muncul karena...",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "Kebutuhan tidak terbatas sedangkan sumber daya terbatas",
              options: {
                create: [
                  { teks: "Kebutuhan tidak terbatas sedangkan sumber daya terbatas", adalahBenar: true, kode: "A" },
                  { teks: "Harga barang terlalu mahal", adalahBenar: false, kode: "B" },
                  { teks: "Pendapatan masyarakat rendah", adalahBenar: false, kode: "C" },
                  { teks: "Teknologi belum maju", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Ilmu ekonomi mempelajari cara manusia memenuhi kebutuhan",
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
            {
              teks: "Sebutkan 3 macam kebutuhan berdasarkan intensitasnya!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Kebutuhan primer, sekunder, dan tersier",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Ekonomi");
  }

  // Quiz Geografi
  const geografi = kelas11Data.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Geografi - Litosfer",
        deskripsi: "Kuis tentang lapisan bumi dan tenaga pembentuk muka bumi",
        waktuMulai: new Date("2025-11-12T10:00:00"),
        waktuSelesai: new Date("2025-11-12T11:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Lapisan bumi yang paling luar adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "Kerak bumi",
              options: {
                create: [
                  { teks: "Kerak bumi", adalahBenar: true, kode: "A" },
                  { teks: "Mantel bumi", adalahBenar: false, kode: "B" },
                  { teks: "Inti luar", adalahBenar: false, kode: "C" },
                  { teks: "Inti dalam", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Tenaga endogen berasal dari dalam bumi",
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
            {
              teks: "Sebutkan 3 jenis batuan berdasarkan proses pembentukannya!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Batuan beku, sedimen, dan metamorf",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Geografi");
  }

  // Quiz Sejarah
  const sejarah = kelas11Data.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Sejarah - Perjuangan Kemerdekaan Indonesia",
        deskripsi: "Kuis tentang perjuangan bangsa Indonesia merebut kemerdekaan",
        waktuMulai: new Date("2025-11-14T08:00:00"),
        waktuSelesai: new Date("2025-11-14T09:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Indonesia merdeka pada tanggal?",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "17 Agustus 1945",
              options: {
                create: [
                  { teks: "17 Agustus 1945", adalahBenar: true, kode: "A" },
                  { teks: "17 Agustus 1944", adalahBenar: false, kode: "B" },
                  { teks: "1 Juni 1945", adalahBenar: false, kode: "C" },
                  { teks: "20 Mei 1908", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Soekarno dan Hatta merupakan proklamator kemerdekaan Indonesia",
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
            {
              teks: "Siapa yang menjahit bendera merah putih?",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Ibu Fatmawati",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Sejarah");
  }

  // Quiz Sosiologi
  const sosiologi = kelas11Data.find((cst) => cst.subject.namaMapel === "Sosiologi");
  if (sosiologi) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Sosiologi - Interaksi Sosial",
        deskripsi: "Kuis tentang interaksi sosial dan dinamika sosial",
        waktuMulai: new Date("2025-11-16T10:00:00"),
        waktuSelesai: new Date("2025-11-16T11:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: sosiologi.id,
        questions: {
          create: [
            {
              teks: "Syarat terjadinya interaksi sosial adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 30,
              jawabanBenar: "Kontak sosial dan komunikasi",
              options: {
                create: [
                  { teks: "Kontak sosial dan komunikasi", adalahBenar: true, kode: "A" },
                  { teks: "Hanya kontak sosial", adalahBenar: false, kode: "B" },
                  { teks: "Hanya komunikasi", adalahBenar: false, kode: "C" },
                  { teks: "Bertemu langsung", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Sosiologi adalah ilmu yang mempelajari masyarakat",
              jenis: "TRUE_FALSE",
              poin: 30,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: true, kode: "A" },
                  { teks: "Salah", adalahBenar: false, kode: "B" },
                ],
              },
            },
            {
              teks: "Jelaskan apa yang dimaksud dengan mobilitas sosial!",
              jenis: "ESSAY",
              poin: 40,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Sosiologi");
  }

  // Quiz Seni Budaya
  const seniBudaya = kelas11Data.find((cst) => cst.subject.namaMapel === "Seni Budaya");
  if (seniBudaya) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Seni Budaya - Seni Rupa",
        deskripsi: "Kuis tentang unsur-unsur dan prinsip seni rupa",
        waktuMulai: new Date("2025-11-18T08:00:00"),
        waktuSelesai: new Date("2025-11-18T09:00:00"),
        durasiMenit: 45,
        nilaiMaksimal: 100,
        classSubjectTutorId: seniBudaya.id,
        questions: {
          create: [
            {
              teks: "Unsur seni rupa yang paling mendasar adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 30,
              jawabanBenar: "Titik",
              options: {
                create: [
                  { teks: "Titik", adalahBenar: true, kode: "A" },
                  { teks: "Garis", adalahBenar: false, kode: "B" },
                  { teks: "Bidang", adalahBenar: false, kode: "C" },
                  { teks: "Warna", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Seni rupa 3 dimensi memiliki panjang, lebar, dan tinggi",
              jenis: "TRUE_FALSE",
              poin: 30,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: true, kode: "A" },
                  { teks: "Salah", adalahBenar: false, kode: "B" },
                ],
              },
            },
            {
              teks: "Sebutkan 3 warna primer!",
              jenis: "SHORT_ANSWER",
              poin: 40,
              jawabanBenar: "Merah, kuning, biru",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Seni Budaya");
  }

  // Quiz Pendidikan Agama
  const pendidikanAgama = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Agama");
  if (pendidikanAgama) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis Pendidikan Agama - Iman dan Takwa",
        deskripsi: "Kuis tentang penguatan iman dan ketakwaan",
        waktuMulai: new Date("2025-11-20T10:00:00"),
        waktuSelesai: new Date("2025-11-20T11:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: pendidikanAgama.id,
        questions: {
          create: [
            {
              teks: "Rukun iman ada berapa?",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "6",
              options: {
                create: [
                  { teks: "5", adalahBenar: false, kode: "A" },
                  { teks: "6", adalahBenar: true, kode: "B" },
                  { teks: "7", adalahBenar: false, kode: "C" },
                  { teks: "8", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Iman kepada Allah adalah rukun iman yang pertama",
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
            {
              teks: "Jelaskan apa yang dimaksud dengan beriman kepada malaikat!",
              jenis: "ESSAY",
              poin: 50,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: Pendidikan Agama");
  }

  // Quiz PKn
  const pkn = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Kewarganegaraan");
  if (pkn) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis PKn - Pancasila",
        deskripsi: "Kuis tentang Pancasila sebagai dasar negara",
        waktuMulai: new Date("2025-11-22T08:00:00"),
        waktuSelesai: new Date("2025-11-22T09:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: pkn.id,
        questions: {
          create: [
            {
              teks: "Pancasila terdiri dari berapa sila?",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "5",
              options: {
                create: [
                  { teks: "3", adalahBenar: false, kode: "A" },
                  { teks: "4", adalahBenar: false, kode: "B" },
                  { teks: "5", adalahBenar: true, kode: "C" },
                  { teks: "6", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Pancasila disahkan pada tanggal 18 Agustus 1945",
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
            {
              teks: "Sebutkan bunyi sila ke-3 Pancasila!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Persatuan Indonesia",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: PKn");
  }

  // Quiz PJOK
  const pjok = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Jasmani, Olahraga, dan Kesehatan");
  if (pjok) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis PJOK - Permainan Bola Besar",
        deskripsi: "Kuis tentang permainan sepak bola dan bola basket",
        waktuMulai: new Date("2025-11-24T10:00:00"),
        waktuSelesai: new Date("2025-11-24T11:00:00"),
        durasiMenit: 45,
        nilaiMaksimal: 100,
        classSubjectTutorId: pjok.id,
        questions: {
          create: [
            {
              teks: "Satu tim sepak bola terdiri dari berapa pemain?",
              jenis: "MULTIPLE_CHOICE",
              poin: 30,
              jawabanBenar: "11 orang",
              options: {
                create: [
                  { teks: "9 orang", adalahBenar: false, kode: "A" },
                  { teks: "10 orang", adalahBenar: false, kode: "B" },
                  { teks: "11 orang", adalahBenar: true, kode: "C" },
                  { teks: "12 orang", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Permainan bola basket diciptakan oleh James Naismith",
              jenis: "TRUE_FALSE",
              poin: 30,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: true, kode: "A" },
                  { teks: "Salah", adalahBenar: false, kode: "B" },
                ],
              },
            },
            {
              teks: "Sebutkan 3 teknik dasar dalam permainan bola basket!",
              jenis: "SHORT_ANSWER",
              poin: 40,
              jawabanBenar: "Dribbling, passing, shooting",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: PJOK");
  }

  // Quiz TIK
  const tik = kelas11Data.find((cst) => cst.subject.namaMapel === "Teknologi Informasi dan Komunikasi");
  if (tik) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis TIK - Perangkat Keras Komputer",
        deskripsi: "Kuis tentang komponen perangkat keras komputer",
        waktuMulai: new Date("2025-11-26T08:00:00"),
        waktuSelesai: new Date("2025-11-26T09:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: tik.id,
        questions: {
          create: [
            {
              teks: "Otak dari komputer adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "CPU (Central Processing Unit)",
              options: {
                create: [
                  { teks: "CPU (Central Processing Unit)", adalahBenar: true, kode: "A" },
                  { teks: "RAM", adalahBenar: false, kode: "B" },
                  { teks: "Hard Disk", adalahBenar: false, kode: "C" },
                  { teks: "Monitor", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "RAM adalah singkatan dari Random Access Memory",
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
            {
              teks: "Sebutkan 3 perangkat input komputer!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Keyboard, mouse, scanner",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: TIK");
  }

  // Quiz IPA
  const ipa = kelas11Data.find((cst) => cst.subject.namaMapel === "Ilmu Pengetahuan Alam");
  if (ipa) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis IPA - Sistem Pencernaan",
        deskripsi: "Kuis tentang sistem pencernaan manusia",
        waktuMulai: new Date("2025-11-28T10:00:00"),
        waktuSelesai: new Date("2025-11-28T11:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: ipa.id,
        questions: {
          create: [
            {
              teks: "Organ yang menghasilkan enzim pepsin adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 30,
              jawabanBenar: "Lambung",
              options: {
                create: [
                  { teks: "Mulut", adalahBenar: false, kode: "A" },
                  { teks: "Lambung", adalahBenar: true, kode: "B" },
                  { teks: "Usus halus", adalahBenar: false, kode: "C" },
                  { teks: "Usus besar", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Pencernaan kimiawi terjadi di mulut dengan bantuan enzim amilase",
              jenis: "TRUE_FALSE",
              poin: 30,
              jawabanBenar: "true",
              options: {
                create: [
                  { teks: "Benar", adalahBenar: true, kode: "A" },
                  { teks: "Salah", adalahBenar: false, kode: "B" },
                ],
              },
            },
            {
              teks: "Jelaskan fungsi usus besar dalam sistem pencernaan!",
              jenis: "ESSAY",
              poin: 40,
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: IPA");
  }

  // Quiz IPS
  const ips = kelas11Data.find((cst) => cst.subject.namaMapel === "Ilmu Pengetahuan Sosial");
  if (ips) {
    await prisma.quiz.create({
      data: {
        judul: "Kuis IPS - ASEAN",
        deskripsi: "Kuis tentang organisasi ASEAN dan negara anggotanya",
        waktuMulai: new Date("2025-11-30T08:00:00"),
        waktuSelesai: new Date("2025-11-30T09:00:00"),
        durasiMenit: 60,
        nilaiMaksimal: 100,
        classSubjectTutorId: ips.id,
        questions: {
          create: [
            {
              teks: "ASEAN didirikan pada tanggal?",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "8 Agustus 1967",
              options: {
                create: [
                  { teks: "8 Agustus 1967", adalahBenar: true, kode: "A" },
                  { teks: "17 Agustus 1945", adalahBenar: false, kode: "B" },
                  { teks: "28 Oktober 1928", adalahBenar: false, kode: "C" },
                  { teks: "20 Mei 1908", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Indonesia adalah salah satu negara pendiri ASEAN",
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
            {
              teks: "Sebutkan 5 negara pendiri ASEAN!",
              jenis: "SHORT_ANSWER",
              poin: 50,
              jawabanBenar: "Indonesia, Malaysia, Singapura, Thailand, Filipina",
            },
          ],
        },
      },
    });
    console.log("  ✓ Created quiz: IPS");
  }

  console.log("\n✅ Additional quizzes created successfully!\n");
}

createAdditionalQuizzes()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
