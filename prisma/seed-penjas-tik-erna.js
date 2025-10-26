import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for Penjas & TIK by Erna (Semester Genap 2025-2026)...\n");

  // ==================== 1. FETCH DATA DARI DATABASE ====================

  // 1.1 Fetch Academic Year yang aktif (Genap 2025-2026)
  console.log("📚 Fetching active academic year (Genap 2025-2026)...");
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      tahunMulai: 2025,
      tahunSelesai: 2026,
      semester: "GENAP",
      isActive: true,
    },
  });

  if (!academicYear) {
    console.log("❌ Academic Year Genap 2025-2026 tidak ditemukan atau tidak aktif");
    return;
  }
  console.log(`✅ Found Academic Year: ${academicYear.tahunMulai}-${academicYear.tahunSelesai} ${academicYear.semester} (${academicYear.id})\n`);

  // 1.2 Fetch Tutor Erna
  console.log("👩‍🏫 Fetching Tutor Erna...");
  const tutor = await prisma.tutor.findFirst({
    where: {
      namaLengkap: {
        contains: "Erna",
        mode: "insensitive",
      },
    },
    include: {
      user: true,
    },
  });

  if (!tutor) {
    console.log("❌ Tutor Erna tidak ditemukan di database");
    return;
  }
  console.log(`✅ Found Tutor: ${tutor.namaLengkap} (${tutor.id})\n`);

  // 1.3 Fetch Subjects (Penjas & TIK)
  console.log("📖 Fetching subjects (Penjas & TIK)...");
  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        {
          namaMapel: {
            contains: "Pendidikan Jasmani",
            mode: "insensitive",
          },
        },
        {
          namaMapel: {
            contains: "Teknologi Informasi",
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (subjects.length === 0) {
    console.log("❌ Mata pelajaran Penjas atau TIK tidak ditemukan");
    return;
  }

  console.log(`✅ Found ${subjects.length} subjects:`);
  subjects.forEach((subj) => {
    console.log(`   - ${subj.namaMapel} (${subj.id})`);
  });
  console.log();

  // 1.4 Fetch ClassSubjectTutor untuk Erna di semester aktif
  console.log("🔗 Fetching ClassSubjectTutor mappings for Erna...");
  const classSubjectTutors = await prisma.classSubjectTutor.findMany({
    where: {
      tutorId: tutor.id,
      subjectId: {
        in: subjects.map((s) => s.id),
      },
      class: {
        academicYearId: academicYear.id,
      },
    },
    include: {
      class: {
        include: {
          students: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
      subject: true,
    },
  });

  if (classSubjectTutors.length === 0) {
    console.log("❌ Tidak ada ClassSubjectTutor mapping untuk Erna di Penjas/TIK pada semester Genap 2025-2026");
    console.log("   Pastikan data ClassSubjectTutor sudah dibuat di database");
    return;
  }

  console.log(`✅ Found ${classSubjectTutors.length} ClassSubjectTutor mappings:`);
  classSubjectTutors.forEach((cst) => {
    console.log(`   - ${cst.subject.namaMapel} @ ${cst.class.namaKelas} (${cst.class.students.length} siswa)`);
  });
  console.log();

  // ==================== 2. CREATE ASSIGNMENTS & QUIZZES ====================

  let totalCreated = 0;

  for (const cst of classSubjectTutors) {
    const subjectName = cst.subject.namaMapel;
    const className = cst.class.namaKelas;

    console.log(`\n📝 Creating assignments & quizzes for ${subjectName} @ ${className}...\n`);

    // ========== 2.1 UTS (Ujian Tengah Semester) ==========
    console.log("  Creating UTS (Midterm Exam)...");
    const existingUTS = await prisma.assignment.findFirst({
      where: {
        classSubjectTutorId: cst.id,
        jenis: "MIDTERM",
      },
    });

    if (!existingUTS) {
      const uts = await prisma.assignment.create({
        data: {
          judul: `UTS ${subjectName} - ${className}`,
          deskripsi: `Ujian Tengah Semester untuk mata pelajaran ${subjectName}. Kerjakan dengan teliti dan jujur.`,
          jenis: "MIDTERM",
          classSubjectTutorId: cst.id,
          TanggalMulai: new Date("2026-03-15"),
          TanggalSelesai: new Date("2026-03-15"),
          batasWaktuMenit: 90,
          nilaiMaksimal: 100,
          questions: {
            create: [
              {
                teks: subjectName.includes("Jasmani")
                  ? "Jelaskan 5 manfaat utama melakukan pemanasan sebelum berolahraga!"
                  : "Jelaskan pengertian algoritma dan berikan contoh penerapannya dalam kehidupan sehari-hari!",
                jenis: "ESSAY",
                poin: 20,
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Apa yang dimaksud dengan daya tahan kardiovaskular?"
                  : "Apa yang dimaksud dengan sistem operasi pada komputer?",
                jenis: "MULTIPLE_CHOICE",
                poin: 5,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "Kemampuan otot untuk berkontraksi berulang kali", adalahBenar: false },
                        { teks: "Kemampuan jantung dan paru-paru mensuplai oksigen selama aktivitas", adalahBenar: true },
                        { teks: "Kemampuan tubuh untuk melakukan gerakan dengan cepat", adalahBenar: false },
                        { teks: "Kemampuan untuk menjaga keseimbangan tubuh", adalahBenar: false },
                      ]
                    : [
                        { teks: "Program yang digunakan untuk membuat dokumen", adalahBenar: false },
                        { teks: "Perangkat keras komputer", adalahBenar: false },
                        { teks: "Software yang mengelola hardware dan software lainnya", adalahBenar: true },
                        { teks: "Aplikasi untuk browsing internet", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Dalam permainan bola voli, berapa jumlah pemain dalam satu tim yang bermain di lapangan?"
                  : "Berapa jumlah bit dalam 1 byte?",
                jenis: "MULTIPLE_CHOICE",
                poin: 5,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "5 pemain", adalahBenar: false },
                        { teks: "6 pemain", adalahBenar: true },
                        { teks: "7 pemain", adalahBenar: false },
                        { teks: "8 pemain", adalahBenar: false },
                      ]
                    : [
                        { teks: "4 bit", adalahBenar: false },
                        { teks: "8 bit", adalahBenar: true },
                        { teks: "16 bit", adalahBenar: false },
                        { teks: "32 bit", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Olahraga renang termasuk dalam kategori olahraga yang melatih seluruh tubuh."
                  : "Microsoft Word adalah sistem operasi komputer.",
                jenis: "TRUE_FALSE",
                poin: 5,
                options: {
                  create: [
                    { teks: "Benar", adalahBenar: subjectName.includes("Jasmani") ? true : false },
                    { teks: "Salah", adalahBenar: subjectName.includes("Jasmani") ? false : true },
                  ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Apa yang harus dilakukan jika mengalami kram otot saat berolahraga?"
                  : "Sebutkan 3 perangkat input pada komputer!",
                jenis: "SHORT_ANSWER",
                poin: 10,
                jawabanBenar: subjectName.includes("Jasmani")
                  ? "Hentikan aktivitas, regangkan otot yang kram, pijat perlahan, dan minum air"
                  : "Keyboard, mouse, scanner",
              },
            ],
          },
        },
      });
      console.log(`  ✅ Created UTS: ${uts.judul}`);
      totalCreated++;
    } else {
      console.log(`  ⏭️  UTS already exists, skipping...`);
    }

    // ========== 2.2 UAS (Ujian Akhir Semester) ==========
    console.log("  Creating UAS (Final Exam)...");
    const existingUAS = await prisma.assignment.findFirst({
      where: {
        classSubjectTutorId: cst.id,
        jenis: "FINAL_EXAM",
      },
    });

    if (!existingUAS) {
      const uas = await prisma.assignment.create({
        data: {
          judul: `UAS ${subjectName} - ${className}`,
          deskripsi: `Ujian Akhir Semester untuk mata pelajaran ${subjectName}. Soal mencakup seluruh materi semester ini.`,
          jenis: "FINAL_EXAM",
          classSubjectTutorId: cst.id,
          TanggalMulai: new Date("2026-06-15"),
          TanggalSelesai: new Date("2026-06-15"),
          batasWaktuMenit: 120,
          nilaiMaksimal: 100,
          questions: {
            create: [
              {
                teks: subjectName.includes("Jasmani")
                  ? "Jelaskan perbedaan antara olahraga aerobik dan anaerobik beserta contohnya!"
                  : "Jelaskan perbedaan antara Hardware dan Software beserta contohnya masing-masing!",
                jenis: "ESSAY",
                poin: 25,
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Dalam permainan sepak bola, berapa jumlah pemain dalam satu tim?"
                  : "Apa kepanjangan dari CPU?",
                jenis: "MULTIPLE_CHOICE",
                poin: 5,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "9 pemain", adalahBenar: false },
                        { teks: "10 pemain", adalahBenar: false },
                        { teks: "11 pemain", adalahBenar: true },
                        { teks: "12 pemain", adalahBenar: false },
                      ]
                    : [
                        { teks: "Computer Processing Unit", adalahBenar: false },
                        { teks: "Central Processing Unit", adalahBenar: true },
                        { teks: "Central Program Unit", adalahBenar: false },
                        { teks: "Computer Program Unit", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Senam irama juga dikenal dengan nama senam ritmik."
                  : "RAM adalah perangkat penyimpanan permanen pada komputer.",
                jenis: "TRUE_FALSE",
                poin: 5,
                options: {
                  create: [
                    { teks: "Benar", adalahBenar: subjectName.includes("Jasmani") ? true : false },
                    { teks: "Salah", adalahBenar: subjectName.includes("Jasmani") ? false : true },
                  ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Jelaskan teknik dasar passing bawah dalam permainan bola voli!"
                  : "Jelaskan fungsi dari motherboard pada komputer!",
                jenis: "ESSAY",
                poin: 20,
              },
            ],
          },
        },
      });
      console.log(`  ✅ Created UAS: ${uas.judul}`);
      totalCreated++;
    } else {
      console.log(`  ⏭️  UAS already exists, skipping...`);
    }

    // ========== 2.3 TUGAS (Exercise) ==========
    console.log("  Creating Tugas (Exercise)...");
    const existingTugas = await prisma.assignment.findFirst({
      where: {
        classSubjectTutorId: cst.id,
        jenis: "EXERCISE",
      },
    });

    if (!existingTugas) {
      const tugas = await prisma.assignment.create({
        data: {
          judul: subjectName.includes("Jasmani")
            ? `Tugas Praktik Olahraga - ${className}`
            : `Tugas Membuat Presentasi - ${className}`,
          deskripsi: subjectName.includes("Jasmani")
            ? "Lakukan latihan fisik berikut selama 1 minggu: Push up (10x sehari), Sit up (15x sehari), dan Lari ditempat (5 menit). Dokumentasikan dalam video atau foto."
            : "Buat presentasi PowerPoint tentang sejarah perkembangan komputer dari generasi pertama hingga sekarang. Minimal 10 slide.",
          jenis: "EXERCISE",
          classSubjectTutorId: cst.id,
          TanggalMulai: new Date("2026-02-01"),
          TanggalSelesai: new Date("2026-02-14"),
          nilaiMaksimal: 100,
          questions: {
            create: [
              {
                teks: subjectName.includes("Jasmani")
                  ? "Upload dokumentasi latihan fisik Anda (video/foto) beserta catatan harian."
                  : "Upload file presentasi PowerPoint Anda di sini.",
                jenis: "ESSAY",
                poin: 100,
              },
            ],
          },
        },
      });
      console.log(`  ✅ Created Tugas: ${tugas.judul}`);
      totalCreated++;
    } else {
      console.log(`  ⏭️  Tugas already exists, skipping...`);
    }

    // ========== 2.4 UJIAN HARIAN (Daily Test) ==========
    console.log("  Creating Ujian Harian (Daily Test)...");
    const existingUjianHarian = await prisma.assignment.findFirst({
      where: {
        classSubjectTutorId: cst.id,
        jenis: "DAILY_TEST",
      },
    });

    if (!existingUjianHarian) {
      const ujianHarian = await prisma.assignment.create({
        data: {
          judul: subjectName.includes("Jasmani")
            ? `Ujian Harian - Kebugaran Jasmani - ${className}`
            : `Ujian Harian - Dasar Komputer - ${className}`,
          deskripsi: subjectName.includes("Jasmani")
            ? "Ujian harian tentang materi kebugaran jasmani dan kesehatan."
            : "Ujian harian tentang dasar-dasar komputer dan sistem operasi.",
          jenis: "DAILY_TEST",
          classSubjectTutorId: cst.id,
          TanggalMulai: new Date("2026-02-20"),
          TanggalSelesai: new Date("2026-02-20"),
          batasWaktuMenit: 45,
          nilaiMaksimal: 100,
          questions: {
            create: [
              {
                teks: subjectName.includes("Jasmani")
                  ? "Apa tujuan utama dari melakukan pendinginan setelah berolahraga?"
                  : "Apa fungsi utama dari sistem operasi?",
                jenis: "MULTIPLE_CHOICE",
                poin: 10,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "Meningkatkan massa otot", adalahBenar: false },
                        { teks: "Menormalkan denyut jantung dan mencegah cedera", adalahBenar: true },
                        { teks: "Membakar lebih banyak kalori", adalahBenar: false },
                        { teks: "Meningkatkan kecepatan lari", adalahBenar: false },
                      ]
                    : [
                        { teks: "Membuat dokumen", adalahBenar: false },
                        { teks: "Mengelola hardware dan software", adalahBenar: true },
                        { teks: "Browsing internet", adalahBenar: false },
                        { teks: "Mengedit foto", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Latihan push up bermanfaat untuk melatih otot dada dan lengan."
                  : "Hard disk adalah perangkat penyimpanan sementara.",
                jenis: "TRUE_FALSE",
                poin: 10,
                options: {
                  create: [
                    { teks: "Benar", adalahBenar: subjectName.includes("Jasmani") ? true : false },
                    { teks: "Salah", adalahBenar: subjectName.includes("Jasmani") ? false : true },
                  ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Sebutkan 3 komponen kebugaran jasmani!"
                  : "Sebutkan 3 contoh sistem operasi yang Anda ketahui!",
                jenis: "SHORT_ANSWER",
                poin: 15,
                jawabanBenar: subjectName.includes("Jasmani")
                  ? "Daya tahan, kekuatan, kelincahan"
                  : "Windows, Linux, MacOS",
              },
            ],
          },
        },
      });
      console.log(`  ✅ Created Ujian Harian: ${ujianHarian.judul}`);
      totalCreated++;
    } else {
      console.log(`  ⏭️  Ujian Harian already exists, skipping...`);
    }

    // ========== 2.5 KUIS (Quiz) ==========
    console.log("  Creating Kuis (Quiz)...");
    const existingKuis = await prisma.quiz.findFirst({
      where: {
        classSubjectTutorId: cst.id,
      },
    });

    if (!existingKuis) {
      const now = new Date();
      const waktuMulai = new Date("2026-03-01T08:00:00");
      const waktuSelesai = new Date("2026-03-01T09:00:00");

      const kuis = await prisma.quiz.create({
        data: {
          judul: subjectName.includes("Jasmani")
            ? `Kuis Cepat - Olahraga & Kesehatan - ${className}`
            : `Kuis Cepat - Teknologi Informasi - ${className}`,
          deskripsi: subjectName.includes("Jasmani")
            ? "Kuis singkat tentang olahraga dan kesehatan. Waktu terbatas!"
            : "Kuis singkat tentang teknologi informasi. Waktu terbatas!",
          classSubjectTutorId: cst.id,
          waktuMulai,
          waktuSelesai,
          durasiMenit: 20,
          nilaiMaksimal: 100,
          acakSoal: true,
          acakJawaban: true,
          questions: {
            create: [
              {
                teks: subjectName.includes("Jasmani")
                  ? "Berapa lama waktu ideal untuk melakukan pemanasan?"
                  : "Apa yang dimaksud dengan internet?",
                jenis: "MULTIPLE_CHOICE",
                poin: 20,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "1-3 menit", adalahBenar: false },
                        { teks: "5-10 menit", adalahBenar: true },
                        { teks: "15-20 menit", adalahBenar: false },
                        { teks: "30 menit", adalahBenar: false },
                      ]
                    : [
                        { teks: "Jaringan komputer lokal", adalahBenar: false },
                        { teks: "Jaringan komputer global", adalahBenar: true },
                        { teks: "Software komputer", adalahBenar: false },
                        { teks: "Hardware komputer", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Lari marathon termasuk olahraga yang melatih daya tahan."
                  : "Email adalah singkatan dari Electronic Mail.",
                jenis: "TRUE_FALSE",
                poin: 20,
                options: {
                  create: [
                    { teks: "Benar", adalahBenar: true },
                    { teks: "Salah", adalahBenar: false },
                  ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Olahraga apa yang paling baik untuk melatih otot kaki?"
                  : "Apa kepanjangan dari WWW?",
                jenis: "MULTIPLE_CHOICE",
                poin: 20,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "Renang", adalahBenar: false },
                        { teks: "Lari atau Squat", adalahBenar: true },
                        { teks: "Push up", adalahBenar: false },
                        { teks: "Sit up", adalahBenar: false },
                      ]
                    : [
                        { teks: "World Web Wide", adalahBenar: false },
                        { teks: "World Wide Web", adalahBenar: true },
                        { teks: "Web World Wide", adalahBenar: false },
                        { teks: "Wide World Web", adalahBenar: false },
                      ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Minum air putih saat berolahraga tidak perlu dilakukan."
                  : "Browser adalah software untuk mengakses internet.",
                jenis: "TRUE_FALSE",
                poin: 20,
                options: {
                  create: [
                    { teks: "Benar", adalahBenar: subjectName.includes("Jasmani") ? false : true },
                    { teks: "Salah", adalahBenar: subjectName.includes("Jasmani") ? true : false },
                  ],
                },
              },
              {
                teks: subjectName.includes("Jasmani")
                  ? "Body Mass Index (BMI) digunakan untuk mengukur apa?"
                  : "Apa fungsi dari web browser?",
                jenis: "MULTIPLE_CHOICE",
                poin: 20,
                options: {
                  create: subjectName.includes("Jasmani")
                    ? [
                        { teks: "Kecepatan lari", adalahBenar: false },
                        { teks: "Kelentukan tubuh", adalahBenar: false },
                        { teks: "Proporsi berat badan terhadap tinggi badan", adalahBenar: true },
                        { teks: "Daya tahan otot", adalahBenar: false },
                      ]
                    : [
                        { teks: "Membuat website", adalahBenar: false },
                        { teks: "Mengakses dan menampilkan halaman web", adalahBenar: true },
                        { teks: "Mengedit foto", adalahBenar: false },
                        { teks: "Membuat dokumen", adalahBenar: false },
                      ],
                },
              },
            ],
          },
        },
      });
      console.log(`  ✅ Created Kuis: ${kuis.judul}`);
      totalCreated++;
    } else {
      console.log(`  ⏭️  Kuis already exists, skipping...`);
    }
  }

  console.log(`\n🎉 Selesai! Total ${totalCreated} assignments/quizzes created`);
  console.log("\n📊 Summary:");
  console.log(`   - Academic Year: ${academicYear.tahunMulai}-${academicYear.tahunSelesai} ${academicYear.semester}`);
  console.log(`   - Tutor: ${tutor.namaLengkap}`);
  console.log(`   - Subjects: ${subjects.map(s => s.namaMapel).join(", ")}`);
  console.log(`   - Classes: ${classSubjectTutors.map(cst => cst.class.namaKelas).join(", ")}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
