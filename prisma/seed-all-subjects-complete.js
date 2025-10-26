import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function untuk generate jawaban
const generateAnswer = (question) => {
  if (question.jenis === "MULTIPLE_CHOICE" || question.jenis === "TRUE_FALSE") {
    const correctOption = question.options.find((opt) => opt.adalahBenar);
    const isCorrect = Math.random() < 0.75;

    if (isCorrect && correctOption) {
      return {
        jawaban: correctOption.teks,
        adalahBenar: true,
      };
    } else {
      const wrongOptions = question.options.filter((opt) => !opt.adalahBenar);
      if (wrongOptions.length > 0) {
        const randomWrong =
          wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        return {
          jawaban: randomWrong.teks,
          adalahBenar: false,
        };
      }
    }
  } else if (question.jenis === "SHORT_ANSWER") {
    const isCorrect = Math.random() < 0.7;
    return {
      jawaban: isCorrect
        ? question.jawabanBenar || "Jawaban pendek siswa yang benar"
        : "Jawaban kurang tepat",
      adalahBenar: isCorrect,
    };
  } else if (question.jenis === "ESSAY") {
    return {
      jawaban:
        "Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      adalahBenar: null,
    };
  }

  return {
    jawaban: "Tidak dijawab",
    adalahBenar: false,
  };
};

// Helper untuk calculate nilai submission
const calculateScore = (answers, questions) => {
  let totalPoin = 0;
  let earnedPoin = 0;

  answers.forEach((answer, index) => {
    const question = questions[index];
    totalPoin += question.poin;

    if (answer.adalahBenar === true) {
      earnedPoin += question.poin;
    } else if (answer.adalahBenar === null) {
      earnedPoin += question.poin * (0.6 + Math.random() * 0.35);
    }
  });

  return totalPoin > 0 ? (earnedPoin / totalPoin) * 100 : 0;
};

// Content generator berdasarkan mata pelajaran
const getSubjectContent = (subjectName) => {
  const contents = {
    "Bahasa Indonesia": {
      uts: {
        questions: [
          {
            teks: "Jelaskan perbedaan antara teks eksposisi dan teks argumentasi!",
            jenis: "ESSAY",
            poin: 20,
          },
          {
            teks: "Apa yang dimaksud dengan kalimat efektif?",
            jenis: "MULTIPLE_CHOICE",
            poin: 5,
            options: [
              { teks: "Kalimat yang panjang dan berbelit-belit", adalahBenar: false },
              { teks: "Kalimat yang hemat kata, jelas, dan mudah dipahami", adalahBenar: true },
              { teks: "Kalimat yang menggunakan kata-kata sulit", adalahBenar: false },
              { teks: "Kalimat yang berisi banyak kata serapan", adalahBenar: false },
            ],
          },
          {
            teks: "Unsur intrinsik cerpen meliputi tema, alur, tokoh, dan latar.",
            jenis: "TRUE_FALSE",
            poin: 5,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Sebutkan 3 jenis majas yang Anda ketahui!",
            jenis: "SHORT_ANSWER",
            poin: 10,
            jawabanBenar: "Metafora, simile, personifikasi",
          },
        ],
      },
      uas: {
        questions: [
          {
            teks: "Analisis struktur teks hikayat dan bandingkan dengan cerpen modern!",
            jenis: "ESSAY",
            poin: 25,
          },
          {
            teks: "Apa fungsi utama dari paragraf pembuka dalam sebuah karangan?",
            jenis: "MULTIPLE_CHOICE",
            poin: 5,
            options: [
              { teks: "Menutup karangan", adalahBenar: false },
              { teks: "Menarik perhatian pembaca dan memperkenalkan topik", adalahBenar: true },
              { teks: "Memberikan kesimpulan", adalahBenar: false },
              { teks: "Menjelaskan daftar pustaka", adalahBenar: false },
            ],
          },
          {
            teks: "Puisi adalah karya sastra yang ditulis dalam bentuk prosa.",
            jenis: "TRUE_FALSE",
            poin: 5,
            options: [
              { teks: "Benar", adalahBenar: false },
              { teks: "Salah", adalahBenar: true },
            ],
          },
          {
            teks: "Jelaskan pengertian dari diksi dalam karya sastra!",
            jenis: "ESSAY",
            poin: 20,
          },
        ],
      },
      tugas: {
        title: "Tugas Analisis Teks Sastra",
        description: "Baca dan analisis sebuah cerpen pilihan Anda. Identifikasi unsur intrinsik dan ekstrinsiknya dalam bentuk laporan tertulis minimal 3 halaman.",
      },
      ujianHarian: {
        questions: [
          {
            teks: "Apa yang dimaksud dengan ide pokok paragraf?",
            jenis: "MULTIPLE_CHOICE",
            poin: 10,
            options: [
              { teks: "Kalimat penutup paragraf", adalahBenar: false },
              { teks: "Gagasan utama yang menjadi dasar paragraf", adalahBenar: true },
              { teks: "Kalimat penjelas", adalahBenar: false },
              { teks: "Kesimpulan paragraf", adalahBenar: false },
            ],
          },
          {
            teks: "Ejaan Yang Disempurnakan (EYD) telah diganti menjadi Pedoman Umum Ejaan Bahasa Indonesia (PUEBI).",
            jenis: "TRUE_FALSE",
            poin: 10,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Sebutkan 3 jenis kalimat berdasarkan fungsinya!",
            jenis: "SHORT_ANSWER",
            poin: 15,
            jawabanBenar: "Kalimat berita, kalimat tanya, kalimat perintah",
          },
        ],
      },
      kuis: {
        questions: [
          {
            teks: "Apa nama lain dari majas perbandingan?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Majas sindiran", adalahBenar: false },
              { teks: "Majas simile", adalahBenar: true },
              { teks: "Majas penegasan", adalahBenar: false },
              { teks: "Majas pertentangan", adalahBenar: false },
            ],
          },
          {
            teks: "Pantun memiliki pola rima a-b-a-b.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Apa perbedaan antara fabel dan dongeng?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Fabel menggunakan tokoh hewan, dongeng bisa manusia atau makhluk gaib", adalahBenar: true },
              { teks: "Tidak ada perbedaan", adalahBenar: false },
              { teks: "Fabel lebih panjang dari dongeng", adalahBenar: false },
              { teks: "Dongeng hanya untuk anak-anak", adalahBenar: false },
            ],
          },
          {
            teks: "Rima adalah persamaan bunyi pada akhir baris puisi.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Apa yang dimaksud dengan aliterasi dalam puisi?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Pengulangan bunyi vokal", adalahBenar: false },
              { teks: "Pengulangan bunyi konsonan di awal kata", adalahBenar: true },
              { teks: "Persamaan bunyi di akhir baris", adalahBenar: false },
              { teks: "Gaya bahasa kiasan", adalahBenar: false },
            ],
          },
        ],
      },
    },
    "Matematika": {
      ujianHarian: {
        questions: [
          {
            teks: "Berapakah hasil dari 3² + 4² ?",
            jenis: "MULTIPLE_CHOICE",
            poin: 10,
            options: [
              { teks: "25", adalahBenar: true },
              { teks: "49", adalahBenar: false },
              { teks: "16", adalahBenar: false },
              { teks: "12", adalahBenar: false },
            ],
          },
          {
            teks: "Persamaan garis y = 2x + 3 memiliki gradien 2.",
            jenis: "TRUE_FALSE",
            poin: 10,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Sebutkan rumus luas segitiga!",
            jenis: "SHORT_ANSWER",
            poin: 15,
            jawabanBenar: "½ × alas × tinggi",
          },
        ],
      },
      kuis: {
        questions: [
          {
            teks: "Berapakah nilai dari √144 ?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "10", adalahBenar: false },
              { teks: "12", adalahBenar: true },
              { teks: "14", adalahBenar: false },
              { teks: "16", adalahBenar: false },
            ],
          },
          {
            teks: "Sudut siku-siku besarnya 90 derajat.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Berapa jumlah sisi pada kubus?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "4", adalahBenar: false },
              { teks: "6", adalahBenar: true },
              { teks: "8", adalahBenar: false },
              { teks: "12", adalahBenar: false },
            ],
          },
          {
            teks: "Lingkaran memiliki diameter yang merupakan 2 kali jari-jari.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "Benar", adalahBenar: true },
              { teks: "Salah", adalahBenar: false },
            ],
          },
          {
            teks: "Apa nama sudut yang besarnya kurang dari 90 derajat?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Sudut tumpul", adalahBenar: false },
              { teks: "Sudut lancip", adalahBenar: true },
              { teks: "Sudut siku-siku", adalahBenar: false },
              { teks: "Sudut lurus", adalahBenar: false },
            ],
          },
        ],
      },
    },
    "Bahasa Inggris": {
      ujianHarian: {
        questions: [
          {
            teks: "What is the past tense of 'go'?",
            jenis: "MULTIPLE_CHOICE",
            poin: 10,
            options: [
              { teks: "goed", adalahBenar: false },
              { teks: "went", adalahBenar: true },
              { teks: "gone", adalahBenar: false },
              { teks: "going", adalahBenar: false },
            ],
          },
          {
            teks: "'She is reading a book' is in present continuous tense.",
            jenis: "TRUE_FALSE",
            poin: 10,
            options: [
              { teks: "True", adalahBenar: true },
              { teks: "False", adalahBenar: false },
            ],
          },
          {
            teks: "Translate to English: 'Saya suka membaca buku'",
            jenis: "SHORT_ANSWER",
            poin: 15,
            jawabanBenar: "I like reading books",
          },
        ],
      },
      kuis: {
        questions: [
          {
            teks: "Which one is a pronoun?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Beautiful", adalahBenar: false },
              { teks: "He", adalahBenar: true },
              { teks: "Run", adalahBenar: false },
              { teks: "Quickly", adalahBenar: false },
            ],
          },
          {
            teks: "'They are playing football' is grammatically correct.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "True", adalahBenar: true },
              { teks: "False", adalahBenar: false },
            ],
          },
          {
            teks: "What does 'hello' mean in Indonesian?",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "Selamat tinggal", adalahBenar: false },
              { teks: "Halo/Hai", adalahBenar: true },
              { teks: "Terima kasih", adalahBenar: false },
              { teks: "Maaf", adalahBenar: false },
            ],
          },
          {
            teks: "An adjective describes a noun.",
            jenis: "TRUE_FALSE",
            poin: 20,
            options: [
              { teks: "True", adalahBenar: true },
              { teks: "False", adalahBenar: false },
            ],
          },
          {
            teks: "Choose the correct article: '__ apple'",
            jenis: "MULTIPLE_CHOICE",
            poin: 20,
            options: [
              { teks: "a", adalahBenar: false },
              { teks: "an", adalahBenar: true },
              { teks: "the", adalahBenar: false },
              { teks: "some", adalahBenar: false },
            ],
          },
        ],
      },
    },
  };

  // Default content untuk mata pelajaran yang tidak ada template khusus
  const defaultContent = {
    uts: {
      questions: [
        {
          teks: `Jelaskan konsep utama yang dipelajari dalam mata pelajaran ${subjectName}!`,
          jenis: "ESSAY",
          poin: 20,
        },
        {
          teks: `Apa yang Anda ketahui tentang ${subjectName}?`,
          jenis: "ESSAY",
          poin: 15,
        },
        {
          teks: `Topik yang dipelajari dalam ${subjectName} sangat penting untuk kehidupan sehari-hari.`,
          jenis: "TRUE_FALSE",
          poin: 5,
          options: [
            { teks: "Benar", adalahBenar: true },
            { teks: "Salah", adalahBenar: false },
          ],
        },
      ],
    },
    uas: {
      questions: [
        {
          teks: `Analisis materi ${subjectName} yang telah dipelajari selama semester ini!`,
          jenis: "ESSAY",
          poin: 25,
        },
        {
          teks: `Sebutkan manfaat mempelajari ${subjectName} dalam kehidupan sehari-hari!`,
          jenis: "ESSAY",
          poin: 20,
        },
      ],
    },
    tugas: {
      title: `Tugas ${subjectName}`,
      description: `Kerjakan tugas terkait materi ${subjectName} yang telah dijelaskan di kelas. Buat laporan lengkap dengan penjelasan yang jelas.`,
    },
    ujianHarian: {
      questions: [
        {
          teks: `Jelaskan singkat tentang materi ${subjectName} yang baru dipelajari!`,
          jenis: "ESSAY",
          poin: 35,
        },
      ],
    },
    kuis: {
      questions: [
        {
          teks: `Apakah Anda memahami materi ${subjectName} yang telah dipelajari?`,
          jenis: "TRUE_FALSE",
          poin: 50,
          options: [
            { teks: "Ya", adalahBenar: true },
            { teks: "Tidak", adalahBenar: false },
          ],
        },
        {
          teks: `Sebutkan hal penting yang Anda pelajari dari ${subjectName}!`,
          jenis: "ESSAY",
          poin: 50,
        },
      ],
    },
  };

  return contents[subjectName] || defaultContent;
};

async function createAssignmentWithSubmissions(
  cst,
  type,
  content,
  students,
  dates
) {
  const existingAssignment = await prisma.assignment.findFirst({
    where: {
      classSubjectTutorId: cst.id,
      jenis: type,
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (existingAssignment) {
    console.log(`  ⏭️  ${type} already exists, skipping...`);
    return 0;
  }

  // Format questions properly for Prisma
  const formattedQuestions = content.questions.map((q) => {
    const question = {
      teks: q.teks,
      jenis: q.jenis,
      poin: q.poin,
    };

    if (q.jawabanBenar) {
      question.jawabanBenar = q.jawabanBenar;
    }

    if (q.options) {
      question.options = {
        create: q.options,
      };
    }

    return question;
  });

  const assignment = await prisma.assignment.create({
    data: {
      judul: content.title,
      deskripsi: content.description,
      jenis: type,
      classSubjectTutorId: cst.id,
      TanggalMulai: dates.start,
      TanggalSelesai: dates.end,
      batasWaktuMenit: dates.duration,
      nilaiMaksimal: 100,
      questions: {
        create: formattedQuestions,
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log(`  ✅ Created ${type}: ${assignment.judul}`);

  // Generate submissions
  let submissionsCreated = 0;
  for (const student of students) {
    const answers = assignment.questions.map((q) => generateAnswer(q));
    const nilai = calculateScore(answers, assignment.questions);

    const waktuMulai = new Date(dates.start);
    waktuMulai.setHours(8, 0, 0);
    const waktuKumpul = new Date(
      waktuMulai.getTime() + Math.random() * (dates.duration || 90) * 60000
    );

    await prisma.submission.create({
      data: {
        studentId: student.id,
        assignmentId: assignment.id,
        status: "GRADED",
        waktuMulai,
        waktuKumpul,
        nilai,
        waktuDinilai: waktuKumpul,
        answers: {
          create: assignment.questions.map((question, idx) => ({
            questionId: question.id,
            jawaban: answers[idx].jawaban,
            adalahBenar: answers[idx].adalahBenar,
            nilai:
              answers[idx].adalahBenar === true
                ? question.poin
                : answers[idx].adalahBenar === null
                ? question.poin * (0.6 + Math.random() * 0.35)
                : 0,
          })),
        },
      },
    });
    submissionsCreated++;
  }

  console.log(`  📤 Generated ${submissionsCreated} submissions`);
  return 1;
}

async function createQuizWithSubmissions(cst, content, students, dates) {
  const existingQuiz = await prisma.quiz.findFirst({
    where: {
      classSubjectTutorId: cst.id,
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  if (existingQuiz) {
    console.log(`  ⏭️  Quiz already exists, skipping...`);
    return 0;
  }

  // Format questions properly for Prisma
  const formattedQuestions = content.questions.map((q) => {
    const question = {
      teks: q.teks,
      jenis: q.jenis,
      poin: q.poin,
    };

    if (q.jawabanBenar) {
      question.jawabanBenar = q.jawabanBenar;
    }

    if (q.options) {
      question.options = {
        create: q.options,
      };
    }

    return question;
  });

  const quiz = await prisma.quiz.create({
    data: {
      judul: content.title,
      deskripsi: content.description,
      classSubjectTutorId: cst.id,
      waktuMulai: dates.start,
      waktuSelesai: dates.end,
      durasiMenit: dates.duration,
      nilaiMaksimal: 100,
      acakSoal: true,
      acakJawaban: true,
      questions: {
        create: formattedQuestions,
      },
    },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  console.log(`  ✅ Created Quiz: ${quiz.judul}`);

  // Generate submissions
  let submissionsCreated = 0;
  for (const student of students) {
    const answers = quiz.questions.map((q) => generateAnswer(q));
    const nilai = calculateScore(answers, quiz.questions);

    const waktuMulai = new Date(dates.start);
    const waktuKumpul = new Date(
      waktuMulai.getTime() + Math.random() * dates.duration * 60000
    );

    await prisma.submission.create({
      data: {
        studentId: student.id,
        quizId: quiz.id,
        status: "GRADED",
        waktuMulai,
        waktuKumpul,
        nilai,
        waktuDinilai: waktuKumpul,
        answers: {
          create: quiz.questions.map((question, idx) => ({
            questionId: question.id,
            jawaban: answers[idx].jawaban,
            adalahBenar: answers[idx].adalahBenar,
            nilai:
              answers[idx].adalahBenar === true
                ? question.poin
                : answers[idx].adalahBenar === null
                ? question.poin * (0.6 + Math.random() * 0.35)
                : 0,
          })),
        },
      },
    });
    submissionsCreated++;
  }

  console.log(`  📤 Generated ${submissionsCreated} submissions`);
  return 1;
}

async function main() {
  console.log("🌱 Starting comprehensive seed for all incomplete subjects...\n");

  const academicYear = await prisma.academicYear.findFirst({
    where: {
      tahunMulai: 2025,
      tahunSelesai: 2026,
      semester: "GENAP",
      isActive: true,
    },
  });

  if (!academicYear) {
    console.log("❌ Academic Year not found");
    return;
  }

  console.log(`✅ Academic Year: ${academicYear.tahunMulai}-${academicYear.tahunSelesai} ${academicYear.semester}\n`);

  // Fetch all ClassSubjectTutor untuk semester aktif
  const classSubjectTutors = await prisma.classSubjectTutor.findMany({
    where: {
      class: {
        academicYearId: academicYear.id,
      },
    },
    include: {
      subject: true,
      tutor: true,
      class: {
        include: {
          students: {
            where: {
              status: "ACTIVE",
            },
          },
        },
      },
      assignments: true,
      quizzes: true,
    },
  });

  let totalCreated = 0;
  let totalSubmissions = 0;

  for (const cst of classSubjectTutors) {
    const subjectName = cst.subject.namaMapel;
    const className = cst.class.namaKelas;
    const students = cst.class.students;

    console.log(`\n${"=".repeat(80)}`);
    console.log(`📚 ${subjectName} @ ${className}`);
    console.log(`   Tutor: ${cst.tutor.namaLengkap} | Students: ${students.length}`);
    console.log(`${"=".repeat(80)}\n`);

    const content = getSubjectContent(subjectName);

    // Check what's missing
    const hasUTS = cst.assignments.some((a) => a.jenis === "MIDTERM");
    const hasUAS = cst.assignments.some((a) => a.jenis === "FINAL_EXAM");
    const hasTugas = cst.assignments.some((a) => a.jenis === "EXERCISE");
    const hasUjianHarian = cst.assignments.some((a) => a.jenis === "DAILY_TEST");
    const hasKuis = cst.quizzes.length > 0;

    console.log(`📊 Status: UTS:${hasUTS?'✅':'❌'} UAS:${hasUAS?'✅':'❌'} Tugas:${hasTugas?'✅':'❌'} UH:${hasUjianHarian?'✅':'❌'} Kuis:${hasKuis?'✅':'❌'}\n`);

    // Create UTS if missing
    if (!hasUTS && content.uts) {
      const created = await createAssignmentWithSubmissions(
        cst,
        "MIDTERM",
        {
          title: `UTS ${subjectName} - ${className}`,
          description: `Ujian Tengah Semester untuk mata pelajaran ${subjectName}. Kerjakan dengan teliti dan jujur.`,
          questions: content.uts.questions,
        },
        students,
        { start: new Date("2026-03-15"), end: new Date("2026-03-15"), duration: 90 }
      );
      totalCreated += created;
      totalSubmissions += created * students.length;
    }

    // Create UAS if missing
    if (!hasUAS && content.uas) {
      const created = await createAssignmentWithSubmissions(
        cst,
        "FINAL_EXAM",
        {
          title: `UAS ${subjectName} - ${className}`,
          description: `Ujian Akhir Semester untuk mata pelajaran ${subjectName}. Soal mencakup seluruh materi semester ini.`,
          questions: content.uas.questions,
        },
        students,
        { start: new Date("2026-06-15"), end: new Date("2026-06-15"), duration: 120 }
      );
      totalCreated += created;
      totalSubmissions += created * students.length;
    }

    // Create Tugas if missing
    if (!hasTugas && content.tugas) {
      const created = await createAssignmentWithSubmissions(
        cst,
        "EXERCISE",
        {
          title: content.tugas.title || `Tugas ${subjectName} - ${className}`,
          description: content.tugas.description,
          questions: [
            {
              teks: `Upload hasil tugas ${subjectName} Anda di sini.`,
              jenis: "ESSAY",
              poin: 100,
            },
          ],
        },
        students,
        { start: new Date("2026-02-01"), end: new Date("2026-02-14"), duration: null }
      );
      totalCreated += created;
      totalSubmissions += created * students.length;
    }

    // Create Ujian Harian if missing
    if (!hasUjianHarian && content.ujianHarian) {
      const created = await createAssignmentWithSubmissions(
        cst,
        "DAILY_TEST",
        {
          title: `Ujian Harian ${subjectName} - ${className}`,
          description: `Ujian harian untuk mata pelajaran ${subjectName}.`,
          questions: content.ujianHarian.questions,
        },
        students,
        { start: new Date("2026-02-20"), end: new Date("2026-02-20"), duration: 45 }
      );
      totalCreated += created;
      totalSubmissions += created * students.length;
    }

    // Create Kuis if missing
    if (!hasKuis && content.kuis) {
      const created = await createQuizWithSubmissions(
        cst,
        {
          title: `Kuis ${subjectName} - ${className}`,
          description: `Kuis singkat untuk mata pelajaran ${subjectName}. Waktu terbatas!`,
          questions: content.kuis.questions,
        },
        students,
        {
          start: new Date("2026-03-01T08:00:00"),
          end: new Date("2026-03-01T09:00:00"),
          duration: 20,
        }
      );
      totalCreated += created;
      totalSubmissions += created * students.length;
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 SEEDING COMPLETED!");
  console.log(`${"=".repeat(80)}`);
  console.log(`📊 Summary:`);
  console.log(`   Total Assignments/Quizzes Created: ${totalCreated}`);
  console.log(`   Total Submissions Created: ${totalSubmissions}`);
  console.log(`\n✅ All subjects now have complete data!`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
