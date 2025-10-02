import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedUTSdanUAS() {
  console.log("🌱 Creating UTS & UAS for all subjects (12 mata pelajaran)...\n");

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

  if (kelas11Data.length === 0) {
    console.log("❌ No subjects found for Kelas 11");
    return;
  }

  // Tanggal: 2 Oktober - 20 Oktober 2025
  const tanggalMulai = new Date("2025-10-02");
  const tanggalSelesai = new Date("2025-10-20");

  let utsCount = 0;
  let uasCount = 0;

  // ========== MATEMATIKA ==========
  const matematika = kelas11Data.find((cst) => cst.subject.namaMapel === "Matematika");
  if (matematika) {
    // UTS Matematika
    await prisma.assignment.create({
      data: {
        judul: "UTS Matematika Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester Matematika - Materi Fungsi, Trigonometri, dan Limit",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-02"),
        TanggalSelesai: new Date("2025-10-05"),
        nilaiMaksimal: 100,
        classSubjectTutorId: matematika.id,
        questions: {
          create: [
            {
              teks: "Jelaskan apa yang dimaksud dengan fungsi komposisi dan berikan contoh penerapannya dalam kehidupan sehari-hari!",
              jenis: "ESSAY",
              poin: 20,
              pembahasan: "Fungsi komposisi adalah operasi menggabungkan dua fungsi atau lebih...",
            },
            {
              teks: "Jika f(x) = 3x + 2 dan g(x) = x² - 1, maka (f ∘ g)(2) = ?",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "11",
              pembahasan: "(f ∘ g)(2) = f(g(2)) = f(4-1) = f(3) = 3(3)+2 = 11",
            },
            {
              teks: "Nilai sin 60° adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "½√3",
              options: {
                create: [
                  { teks: "½√3", adalahBenar: true, kode: "A" },
                  { teks: "½", adalahBenar: false, kode: "B" },
                  { teks: "1", adalahBenar: false, kode: "C" },
                  { teks: "√3", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Rumus identitas trigonometri: sin²α + cos²α = 1 berlaku untuk semua nilai α",
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
              teks: "Hitunglah limit dari (x² - 9)/(x - 3) ketika x mendekati 3!",
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "6",
              pembahasan: "Faktorkan: (x-3)(x+3)/(x-3) = x+3, substitusi x=3 = 6",
            },
          ],
        },
      },
    });
    utsCount++;

    // UAS Matematika
    await prisma.assignment.create({
      data: {
        judul: "UAS Matematika Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester Matematika - Materi Barisan, Deret, dan Limit",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-15"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: matematika.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan barisan aritmetika dan barisan geometri! Berikan masing-masing 2 contoh dalam kehidupan nyata!",
              jenis: "ESSAY",
              poin: 25,
              pembahasan: "Barisan aritmetika memiliki selisih tetap, barisan geometri memiliki rasio tetap...",
            },
            {
              teks: "Tentukan suku ke-10 dari barisan aritmetika: 5, 9, 13, 17, ...",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "41",
              pembahasan: "a=5, b=4, U₁₀ = a + (n-1)b = 5 + 9(4) = 41",
            },
            {
              teks: "Rumus suku ke-n barisan geometri adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 25,
              jawabanBenar: "Un = a × r^(n-1)",
              options: {
                create: [
                  { teks: "Un = a × r^(n-1)", adalahBenar: true, kode: "A" },
                  { teks: "Un = a + (n-1)b", adalahBenar: false, kode: "B" },
                  { teks: "Un = a × n × r", adalahBenar: false, kode: "C" },
                  { teks: "Un = a + r^n", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Deret geometri tak hingga konvergen jika |r| < 1",
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
    console.log("  ✓ Created UTS & UAS: Matematika");
  }

  // ========== BAHASA INDONESIA ==========
  const bahasaIndonesia = kelas11Data.find((cst) => cst.subject.namaMapel === "Bahasa Indonesia");
  if (bahasaIndonesia) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Bahasa Indonesia Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Teks Eksposisi, Argumentasi, dan Ceramah",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-03"),
        TanggalSelesai: new Date("2025-10-06"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaIndonesia.id,
        questions: {
          create: [
            {
              teks: "Analisislah struktur teks eksposisi yang meliputi tesis, argumentasi, dan penegasan ulang! Berikan contoh masing-masing bagian!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 3 ciri kebahasaan teks eksposisi!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Menggunakan kata penghubung kausalitas, konjungsi temporal, kata kerja mental",
            },
            {
              teks: "Teks eksposisi bertujuan untuk...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Menjelaskan informasi secara objektif",
              options: {
                create: [
                  { teks: "Menjelaskan informasi secara objektif", adalahBenar: true, kode: "A" },
                  { teks: "Menghibur pembaca", adalahBenar: false, kode: "B" },
                  { teks: "Meyakinkan pembaca", adalahBenar: false, kode: "C" },
                  { teks: "Menceritakan pengalaman", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Teks argumentasi harus didukung dengan data dan fakta yang valid",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Bahasa Indonesia Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Teks Negosiasi, Debat, dan Biografi",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-16"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaIndonesia.id,
        questions: {
          create: [
            {
              teks: "Buatlah teks negosiasi singkat dengan tema 'Negosiasi Harga Barang' yang memuat orientasi, pengajuan, penawaran, persetujuan, dan penutup!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 4 struktur teks biografi!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Orientasi, peristiwa dan masalah, reorientasi, koda",
            },
            {
              teks: "Dalam debat, pihak yang menolak mosi disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Oposisi",
              options: {
                create: [
                  { teks: "Afirmasi", adalahBenar: false, kode: "A" },
                  { teks: "Oposisi", adalahBenar: true, kode: "B" },
                  { teks: "Moderator", adalahBenar: false, kode: "C" },
                  { teks: "Netral", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Teks biografi selalu ditulis berdasarkan kisah nyata seseorang",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Bahasa Indonesia");
  }

  // ========== BAHASA INGGRIS ==========
  const bahasaInggris = kelas11Data.find((cst) => cst.subject.namaMapel === "Bahasa Inggris");
  if (bahasaInggris) {
    await prisma.assignment.create({
      data: {
        judul: "UTS English Grade 11 Odd Semester 2025",
        deskripsi: "Midterm Exam - Tenses, Reading Comprehension, and Grammar",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-04"),
        TanggalSelesai: new Date("2025-10-07"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaInggris.id,
        questions: {
          create: [
            {
              teks: "Write a short paragraph (100-150 words) about your daily routine using Present Simple Tense!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: 'Choose the correct form: "She _____ to the library every Saturday."',
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "goes",
              options: {
                create: [
                  { teks: "go", adalahBenar: false, kode: "A" },
                  { teks: "goes", adalahBenar: true, kode: "B" },
                  { teks: "going", adalahBenar: false, kode: "C" },
                  { teks: "went", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: 'What is the past tense of "write"?',
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "wrote",
            },
            {
              teks: "Present Continuous Tense is used to describe actions happening now or around now",
              jenis: "TRUE_FALSE",
              poin: 30,
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

    await prisma.assignment.create({
      data: {
        judul: "UAS English Grade 11 Odd Semester 2025",
        deskripsi: "Final Exam - Writing, Grammar, and Vocabulary",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-17"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: bahasaInggris.id,
        questions: {
          create: [
            {
              teks: "Write an essay about 'The Importance of Learning English in the Modern World' (minimum 200 words)",
              jenis: "ESSAY",
              poin: 40,
            },
            {
              teks: 'Complete the sentence: "If I _____ rich, I would travel around the world."',
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "were",
              options: {
                create: [
                  { teks: "am", adalahBenar: false, kode: "A" },
                  { teks: "was", adalahBenar: false, kode: "B" },
                  { teks: "were", adalahBenar: true, kode: "C" },
                  { teks: "will be", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: 'What is the meaning of "perseverance"?',
              jenis: "SHORT_ANSWER",
              poin: 20,
              jawabanBenar: "Persistence, determination, not giving up",
            },
            {
              teks: 'The word "their" is a possessive pronoun',
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Bahasa Inggris");
  }

  // ========== EKONOMI ==========
  const ekonomi = kelas11Data.find((cst) => cst.subject.namaMapel === "Ekonomi");
  if (ekonomi) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Ekonomi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Konsep Ekonomi, Kebutuhan, dan Kelangkaan",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-05"),
        TanggalSelesai: new Date("2025-10-08"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan antara kebutuhan dan keinginan! Berikan masing-masing 4 contoh konkret!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Apa yang dimaksud dengan kelangkaan (scarcity) dalam ilmu ekonomi?",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Kondisi dimana kebutuhan manusia tidak terbatas sedangkan alat pemuas kebutuhan terbatas",
            },
            {
              teks: "Biaya peluang (opportunity cost) adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Nilai dari alternatif terbaik yang dikorbankan",
              options: {
                create: [
                  { teks: "Nilai dari alternatif terbaik yang dikorbankan", adalahBenar: true, kode: "A" },
                  { teks: "Biaya produksi suatu barang", adalahBenar: false, kode: "B" },
                  { teks: "Harga barang di pasar", adalahBenar: false, kode: "C" },
                  { teks: "Keuntungan yang diperoleh", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Dalam ilmu ekonomi, manusia dianggap sebagai makhluk rasional yang selalu memaksimalkan kepuasan",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Ekonomi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Sistem Ekonomi dan Mekanisme Pasar",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-16"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: ekonomi.id,
        questions: {
          create: [
            {
              teks: "Bandingkan sistem ekonomi kapitalis, sosialis, dan campuran! Jelaskan kelebihan dan kekurangan masing-masing serta berikan contoh negara yang menerapkannya!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 fungsi pasar dalam perekonomian!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Pembentukan harga, distribusi barang, promosi produk",
            },
            {
              teks: "Hukum permintaan menyatakan bahwa...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Jika harga naik, permintaan turun (ceteris paribus)",
              options: {
                create: [
                  { teks: "Jika harga naik, permintaan turun (ceteris paribus)", adalahBenar: true, kode: "A" },
                  { teks: "Jika harga naik, permintaan naik", adalahBenar: false, kode: "B" },
                  { teks: "Permintaan selalu tetap", adalahBenar: false, kode: "C" },
                  { teks: "Harga tidak mempengaruhi permintaan", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Dalam sistem ekonomi campuran, pemerintah dan swasta sama-sama berperan dalam perekonomian",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Ekonomi");
  }

  // ========== GEOGRAFI ==========
  const geografi = kelas11Data.find((cst) => cst.subject.namaMapel === "Geografi");
  if (geografi) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Geografi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Atmosfer dan Hidrosfer",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-06"),
        TanggalSelesai: new Date("2025-10-09"),
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan lapisan-lapisan atmosfer dan karakteristik masing-masing! Sertakan fenomena yang terjadi di setiap lapisan!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 3 unsur cuaca dan iklim!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Suhu udara, kelembaban, tekanan udara, curah hujan, angin",
            },
            {
              teks: "Lapisan atmosfer yang paling dekat dengan permukaan bumi adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Troposfer",
              options: {
                create: [
                  { teks: "Troposfer", adalahBenar: true, kode: "A" },
                  { teks: "Stratosfer", adalahBenar: false, kode: "B" },
                  { teks: "Mesosfer", adalahBenar: false, kode: "C" },
                  { teks: "Termosfer", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Efek rumah kaca disebabkan oleh penumpukan gas CO2 dan gas lainnya di atmosfer",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Geografi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Litosfer dan Biosfer",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-17"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: geografi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan teori tektonik lempeng dan kaitannya dengan fenomena gempa bumi dan gunung berapi!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 jenis batuan berdasarkan proses pembentukannya!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Batuan beku, batuan sedimen, batuan metamorf",
            },
            {
              teks: "Tenaga yang berasal dari dalam bumi disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Tenaga endogen",
              options: {
                create: [
                  { teks: "Tenaga endogen", adalahBenar: true, kode: "A" },
                  { teks: "Tenaga eksogen", adalahBenar: false, kode: "B" },
                  { teks: "Tenaga radiasi", adalahBenar: false, kode: "C" },
                  { teks: "Tenaga atmosfer", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Indonesia terletak di pertemuan 3 lempeng tektonik: Eurasia, Indo-Australia, dan Pasifik",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Geografi");
  }

  // ========== SEJARAH ==========
  const sejarah = kelas11Data.find((cst) => cst.subject.namaMapel === "Sejarah");
  if (sejarah) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Sejarah Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Pergerakan Nasional Indonesia",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-07"),
        TanggalSelesai: new Date("2025-10-10"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Jelaskan latar belakang lahirnya pergerakan nasional Indonesia pada awal abad 20! Sebutkan faktor internal dan eksternal!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Siapa pendiri organisasi Budi Utomo dan kapan didirikan?",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Dr. Wahidin Sudirohusodo, 20 Mei 1908",
            },
            {
              teks: "Organisasi yang menggunakan asas Islam sebagai dasar perjuangan adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Sarekat Islam",
              options: {
                create: [
                  { teks: "Budi Utomo", adalahBenar: false, kode: "A" },
                  { teks: "Sarekat Islam", adalahBenar: true, kode: "B" },
                  { teks: "Indische Partij", adalahBenar: false, kode: "C" },
                  { teks: "PNI", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Sumpah Pemuda dikumandangkan pada tanggal 28 Oktober 1928",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Sejarah Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Perjuangan Kemerdekaan Indonesia",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-16"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sejarah.id,
        questions: {
          create: [
            {
              teks: "Uraikan proses proklamasi kemerdekaan Indonesia mulai dari Peristiwa Rengasdengklok hingga pembacaan teks proklamasi!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Siapa yang menulis naskah proklamasi kemerdekaan Indonesia?",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Soekarno dan Moh. Hatta",
            },
            {
              teks: "Indonesia merdeka pada tanggal...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "17 Agustus 1945",
              options: {
                create: [
                  { teks: "17 Agustus 1945", adalahBenar: true, kode: "A" },
                  { teks: "17 Agustus 1944", adalahBenar: false, kode: "B" },
                  { teks: "1 Juni 1945", adalahBenar: false, kode: "C" },
                  { teks: "18 Agustus 1945", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Bendera Merah Putih dijahit oleh Ibu Fatmawati",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Sejarah");
  }

  // ========== SOSIOLOGI ==========
  const sosiologi = kelas11Data.find((cst) => cst.subject.namaMapel === "Sosiologi");
  if (sosiologi) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Sosiologi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Interaksi Sosial dan Kelompok Sosial",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-08"),
        TanggalSelesai: new Date("2025-10-11"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sosiologi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan syarat-syarat terjadinya interaksi sosial dan berikan contoh masing-masing dalam kehidupan sehari-hari!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 3 bentuk interaksi sosial asosiatif!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Kerjasama, akomodasi, asimilasi, akulturasi",
            },
            {
              teks: "Kontak sosial dapat terjadi secara...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Langsung dan tidak langsung",
              options: {
                create: [
                  { teks: "Langsung saja", adalahBenar: false, kode: "A" },
                  { teks: "Langsung dan tidak langsung", adalahBenar: true, kode: "B" },
                  { teks: "Tidak langsung saja", adalahBenar: false, kode: "C" },
                  { teks: "Verbal saja", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Konflik termasuk bentuk interaksi sosial disosiatif",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Sosiologi Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Mobilitas Sosial dan Perubahan Sosial",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-17"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: sosiologi.id,
        questions: {
          create: [
            {
              teks: "Jelaskan pengertian mobilitas sosial dan faktor-faktor yang mempengaruhinya! Berikan contoh kasus mobilitas vertikal dan horizontal!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 saluran mobilitas sosial!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Pendidikan, perkawinan, organisasi politik/ekonomi",
            },
            {
              teks: "Perubahan sosial yang terjadi secara cepat disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Revolusi",
              options: {
                create: [
                  { teks: "Evolusi", adalahBenar: false, kode: "A" },
                  { teks: "Revolusi", adalahBenar: true, kode: "B" },
                  { teks: "Modernisasi", adalahBenar: false, kode: "C" },
                  { teks: "Globalisasi", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Teknologi merupakan salah satu faktor pendorong perubahan sosial",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Sosiologi");
  }

  // ========== SENI BUDAYA ==========
  const seniBudaya = kelas11Data.find((cst) => cst.subject.namaMapel === "Seni Budaya");
  if (seniBudaya) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Seni Budaya Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Seni Rupa 2D dan 3D",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-09"),
        TanggalSelesai: new Date("2025-10-12"),
        nilaiMaksimal: 100,
        classSubjectTutorId: seniBudaya.id,
        questions: {
          create: [
            {
              teks: "Jelaskan unsur-unsur seni rupa (minimal 6) dan berikan contoh penerapannya dalam karya seni!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 3 prinsip dasar seni rupa!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Kesatuan, keseimbangan, proporsi, irama, harmoni",
            },
            {
              teks: "Karya seni rupa yang memiliki panjang, lebar, dan tinggi disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Seni rupa 3 dimensi",
              options: {
                create: [
                  { teks: "Seni rupa 2 dimensi", adalahBenar: false, kode: "A" },
                  { teks: "Seni rupa 3 dimensi", adalahBenar: true, kode: "B" },
                  { teks: "Seni rupa terapan", adalahBenar: false, kode: "C" },
                  { teks: "Seni rupa murni", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Warna merah, kuning, dan biru adalah warna primer",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Seni Budaya Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Seni Musik dan Tari",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-18"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: seniBudaya.id,
        questions: {
          create: [
            {
              teks: "Jelaskan unsur-unsur musik dan fungsi seni musik dalam kehidupan masyarakat!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 jenis alat musik tradisional Indonesia!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Gamelan, angklung, sasando, kolintang",
            },
            {
              teks: "Tanda nada yang menunjukkan tinggi rendahnya nada disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Notasi balok",
              options: {
                create: [
                  { teks: "Tempo", adalahBenar: false, kode: "A" },
                  { teks: "Notasi balok", adalahBenar: true, kode: "B" },
                  { teks: "Dinamika", adalahBenar: false, kode: "C" },
                  { teks: "Birama", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Tari Saman berasal dari Aceh",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Seni Budaya");
  }

  // ========== PENDIDIKAN AGAMA ==========
  const pendidikanAgama = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Agama");
  if (pendidikanAgama) {
    await prisma.assignment.create({
      data: {
        judul: "UTS Pendidikan Agama Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Iman, Islam, dan Ihsan",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-10"),
        TanggalSelesai: new Date("2025-10-13"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pendidikanAgama.id,
        questions: {
          create: [
            {
              teks: "Jelaskan pengertian iman, Islam, dan Ihsan serta hubungan ketiganya dalam kehidupan seorang muslim!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 6 rukun iman!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Iman kepada Allah, Malaikat, Kitab, Rasul, Hari Akhir, Qada dan Qadar",
            },
            {
              teks: "Rukun Islam yang pertama adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Syahadat",
              options: {
                create: [
                  { teks: "Syahadat", adalahBenar: true, kode: "A" },
                  { teks: "Shalat", adalahBenar: false, kode: "B" },
                  { teks: "Puasa", adalahBenar: false, kode: "C" },
                  { teks: "Zakat", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Beriman kepada qada dan qadar berarti meyakini bahwa segala sesuatu terjadi atas kehendak Allah",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS Pendidikan Agama Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Akhlak dan Adab Islami",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-18"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pendidikanAgama.id,
        questions: {
          create: [
            {
              teks: "Jelaskan pentingnya akhlak mulia dalam kehidupan dan sebutkan 5 contoh akhlak terpuji beserta cara mengamalkannya!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 sifat wajib Allah dan 3 sifat mustahil Allah!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Wajib: Wujud, Qidam, Baqa; Mustahil: Adam, Hudus, Fana",
            },
            {
              teks: "Sifat terpuji yang harus dimiliki seorang muslim disebut...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Akhlakul karimah",
              options: {
                create: [
                  { teks: "Akhlakul karimah", adalahBenar: true, kode: "A" },
                  { teks: "Akhlakul mazmumah", adalahBenar: false, kode: "B" },
                  { teks: "Taqwa", adalahBenar: false, kode: "C" },
                  { teks: "Sabar", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Berbakti kepada orang tua (birrul walidain) adalah kewajiban setiap muslim",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: Pendidikan Agama");
  }

  // ========== PKN ==========
  const pkn = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Kewarganegaraan");
  if (pkn) {
    await prisma.assignment.create({
      data: {
        judul: "UTS PKn Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Pancasila dan UUD 1945",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-11"),
        TanggalSelesai: new Date("2025-10-14"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pkn.id,
        questions: {
          create: [
            {
              teks: "Jelaskan kedudukan Pancasila sebagai dasar negara dan pandangan hidup bangsa Indonesia! Berikan contoh penerapan nilai-nilai Pancasila!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan bunyi sila ke-4 Pancasila!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan dalam permusyawaratan/perwakilan",
            },
            {
              teks: "Pancasila disahkan pada tanggal...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "18 Agustus 1945",
              options: {
                create: [
                  { teks: "17 Agustus 1945", adalahBenar: false, kode: "A" },
                  { teks: "18 Agustus 1945", adalahBenar: true, kode: "B" },
                  { teks: "1 Juni 1945", adalahBenar: false, kode: "C" },
                  { teks: "22 Juni 1945", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "UUD 1945 mengalami 4 kali amandemen",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS PKn Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - HAM dan Demokrasi",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-18"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pkn.id,
        questions: {
          create: [
            {
              teks: "Jelaskan pengertian HAM dan sebutkan 4 macam HAM beserta contohnya! Jelaskan juga kewajiban asasi manusia!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 lembaga penegak HAM di Indonesia!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Komnas HAM, Pengadilan HAM, Ombudsman",
            },
            {
              teks: "Demokrasi berasal dari bahasa Yunani yang berarti...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Pemerintahan oleh rakyat",
              options: {
                create: [
                  { teks: "Pemerintahan oleh raja", adalahBenar: false, kode: "A" },
                  { teks: "Pemerintahan oleh rakyat", adalahBenar: true, kode: "B" },
                  { teks: "Pemerintahan oleh militer", adalahBenar: false, kode: "C" },
                  { teks: "Pemerintahan oleh agama", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Indonesia menganut sistem demokrasi Pancasila",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: PKn");
  }

  // ========== PJOK ==========
  const pjok = kelas11Data.find((cst) => cst.subject.namaMapel === "Pendidikan Jasmani, Olahraga, dan Kesehatan");
  if (pjok) {
    await prisma.assignment.create({
      data: {
        judul: "UTS PJOK Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Permainan Bola Besar",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-12"),
        TanggalSelesai: new Date("2025-10-15"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pjok.id,
        questions: {
          create: [
            {
              teks: "Jelaskan teknik dasar permainan sepak bola (minimal 5 teknik) dan strategi bermain yang baik!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Sebutkan 3 teknik dasar dalam permainan bola basket!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Dribbling, passing, shooting, pivot, rebound",
            },
            {
              teks: "Satu tim sepak bola terdiri dari berapa pemain?",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "11 pemain",
              options: {
                create: [
                  { teks: "9 pemain", adalahBenar: false, kode: "A" },
                  { teks: "10 pemain", adalahBenar: false, kode: "B" },
                  { teks: "11 pemain", adalahBenar: true, kode: "C" },
                  { teks: "12 pemain", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Bola basket dimainkan dalam 4 quarter",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS PJOK Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Kebugaran Jasmani dan Atletik",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-18"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: pjok.id,
        questions: {
          create: [
            {
              teks: "Jelaskan komponen-komponen kebugaran jasmani dan cara melatih masing-masing komponen tersebut!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 cabang atletik nomor lari!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Lari sprint, lari jarak menengah, lari jarak jauh, lari estafet",
            },
            {
              teks: "Komponen kebugaran jasmani yang berhubungan dengan kekuatan otot adalah...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Kekuatan (strength)",
              options: {
                create: [
                  { teks: "Kekuatan (strength)", adalahBenar: true, kode: "A" },
                  { teks: "Kecepatan (speed)", adalahBenar: false, kode: "B" },
                  { teks: "Kelincahan (agility)", adalahBenar: false, kode: "C" },
                  { teks: "Keseimbangan (balance)", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Pemanasan sebelum olahraga bertujuan untuk mencegah cedera",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: PJOK");
  }

  // ========== TIK ==========
  const tik = kelas11Data.find((cst) => cst.subject.namaMapel === "Teknologi Informasi dan Komunikasi");
  if (tik) {
    await prisma.assignment.create({
      data: {
        judul: "UTS TIK Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Tengah Semester - Perangkat Keras dan Jaringan Komputer",
        jenis: "MIDTERM",
        TanggalMulai: new Date("2025-10-13"),
        TanggalSelesai: new Date("2025-10-16"),
        nilaiMaksimal: 100,
        classSubjectTutorId: tik.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan perangkat input, proses, dan output pada komputer! Berikan masing-masing 3 contoh!",
              jenis: "ESSAY",
              poin: 30,
            },
            {
              teks: "Apa kepanjangan dari CPU dan apa fungsinya?",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "Central Processing Unit, berfungsi sebagai otak komputer untuk memproses data",
            },
            {
              teks: "RAM termasuk jenis memori...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "Volatile (data hilang saat mati)",
              options: {
                create: [
                  { teks: "Volatile (data hilang saat mati)", adalahBenar: true, kode: "A" },
                  { teks: "Non-volatile (data tetap tersimpan)", adalahBenar: false, kode: "B" },
                  { teks: "Cache memory", adalahBenar: false, kode: "C" },
                  { teks: "ROM", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Topologi jaringan star menggunakan hub atau switch sebagai pusat",
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
    utsCount++;

    await prisma.assignment.create({
      data: {
        judul: "UAS TIK Kelas 11 Semester Ganjil 2025",
        deskripsi: "Ujian Akhir Semester - Internet dan Aplikasi",
        jenis: "FINAL_EXAM",
        TanggalMulai: new Date("2025-10-18"),
        TanggalSelesai: new Date("2025-10-20"),
        nilaiMaksimal: 100,
        classSubjectTutorId: tik.id,
        questions: {
          create: [
            {
              teks: "Jelaskan perbedaan internet, intranet, dan ekstranet! Berikan contoh penggunaan masing-masing dalam kehidupan nyata!",
              jenis: "ESSAY",
              poin: 35,
            },
            {
              teks: "Sebutkan 3 protokol yang digunakan dalam internet!",
              jenis: "SHORT_ANSWER",
              poin: 25,
              jawabanBenar: "HTTP, HTTPS, FTP, TCP/IP, SMTP",
            },
            {
              teks: "WWW adalah kepanjangan dari...",
              jenis: "MULTIPLE_CHOICE",
              poin: 20,
              jawabanBenar: "World Wide Web",
              options: {
                create: [
                  { teks: "World Wide Web", adalahBenar: true, kode: "A" },
                  { teks: "World Web Wide", adalahBenar: false, kode: "B" },
                  { teks: "Wide World Web", adalahBenar: false, kode: "C" },
                  { teks: "Web World Wide", adalahBenar: false, kode: "D" },
                ],
              },
            },
            {
              teks: "Cloud computing memungkinkan penyimpanan data di server online",
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
    uasCount++;
    console.log("  ✓ Created UTS & UAS: TIK");
  }

  // Summary
  console.log(`\n✅ SUMMARY:`);
  console.log(`   - Total UTS created: ${utsCount}`);
  console.log(`   - Total UAS created: ${uasCount}`);
  console.log(`   - Total assignments: ${utsCount + uasCount}`);
  console.log(`   - Period: 2 Oktober - 20 Oktober 2025`);
  console.log(`\n🎉 UTS & UAS seeding completed!\n`);
}

seedUTSdanUAS()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
