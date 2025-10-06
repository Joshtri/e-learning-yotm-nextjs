import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed jawaban siswa...\n");

  // 1. Fetch semua siswa di Kelas 11
  const kelas11 = await prisma.class.findMany({
    where: {
      namaKelas: "Kelas 11",
    },
    include: {
      students: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  if (kelas11.length === 0) {
    console.log("❌ Tidak ada Kelas 11 ditemukan");
    return;
  }

  const allStudents = kelas11.flatMap((k) => k.students);
  console.log(`✅ Found ${allStudents.length} students in Kelas 11\n`);

  if (allStudents.length === 0) {
    console.log("❌ Tidak ada siswa di Kelas 11");
    return;
  }

  // 2. Fetch semua Quiz
  const quizzes = await prisma.quiz.findMany({
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      classSubjectTutor: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
  });

  console.log(`✅ Found ${quizzes.length} quizzes\n`);

  // 3. Fetch semua Assignment (termasuk UTS, UAS)
  const assignments = await prisma.assignment.findMany({
    include: {
      questions: {
        include: {
          options: true,
        },
      },
      classSubjectTutor: {
        include: {
          class: true,
          subject: true,
        },
      },
    },
  });

  console.log(`✅ Found ${assignments.length} assignments/exams\n`);

  // Helper function untuk generate jawaban
  const generateAnswer = (question) => {
    if (question.jenis === "MULTIPLE_CHOICE" || question.jenis === "TRUE_FALSE") {
      // Pilih jawaban benar dengan probabilitas 70%, salah 30%
      const correctOption = question.options.find((opt) => opt.adalahBenar);
      const isCorrect = Math.random() < 0.7;

      if (isCorrect && correctOption) {
        return {
          jawaban: correctOption.teks,
          adalahBenar: true,
        };
      } else {
        // Pilih jawaban salah random
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
      // Generate jawaban pendek (70% benar, 30% salah)
      const isCorrect = Math.random() < 0.7;
      return {
        jawaban: isCorrect
          ? question.jawabanBenar || "Jawaban pendek siswa"
          : "Jawaban kurang tepat",
        adalahBenar: isCorrect,
      };
    } else if (question.jenis === "ESSAY") {
      // Generate essay (nilai random 60-100)
      return {
        jawaban:
          "Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        adalahBenar: null, // Essay perlu dinilai manual
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
        // Essay, berikan nilai random 60-100% dari poin
        earnedPoin += question.poin * (0.6 + Math.random() * 0.4);
      }
    });

    return totalPoin > 0 ? (earnedPoin / totalPoin) * 100 : 0;
  };

  let submissionsCreated = 0;

  // 4. Generate submissions untuk Quiz
  console.log("📝 Generating quiz submissions...\n");

  for (const quiz of quizzes) {
    // Filter siswa yang sesuai dengan kelas quiz
    const relevantStudents = allStudents.filter(
      (student) => student.classId === quiz.classSubjectTutor.classId
    );

    if (relevantStudents.length === 0) continue;

    for (const student of relevantStudents) {
      // Skip jika sudah ada submission
      const existing = await prisma.submission.findFirst({
        where: {
          studentId: student.id,
          quizId: quiz.id,
        },
      });

      if (existing) {
        console.log(
          `⏭️  Skip: ${student.namaLengkap} already submitted quiz ${quiz.judul}`
        );
        continue;
      }

      // Generate jawaban untuk semua soal
      const answers = quiz.questions.map((q) => generateAnswer(q));

      // Hitung nilai
      const nilai = calculateScore(answers, quiz.questions);

      // Buat submission
      const waktuMulai = new Date(quiz.waktuMulai);
      const waktuKumpul = new Date(
        waktuMulai.getTime() + Math.random() * quiz.durasiMenit * 60000
      );

      const submission = await prisma.submission.create({
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
                  ? question.poin * (0.6 + Math.random() * 0.4)
                  : 0,
            })),
          },
        },
      });

      submissionsCreated++;
      console.log(
        `✅ Created submission for ${student.namaLengkap} - Quiz: ${quiz.judul} (${nilai.toFixed(2)})`
      );
    }
  }

  // 5. Generate submissions untuk Assignment/Exam (UTS, UAS, Tugas)
  console.log("\n📝 Generating assignment/exam submissions...\n");

  for (const assignment of assignments) {
    // Filter siswa yang sesuai dengan kelas assignment
    const relevantStudents = allStudents.filter(
      (student) => student.classId === assignment.classSubjectTutor.classId
    );

    if (relevantStudents.length === 0) continue;

    for (const student of relevantStudents) {
      // Skip jika sudah ada submission
      const existing = await prisma.submission.findFirst({
        where: {
          studentId: student.id,
          assignmentId: assignment.id,
        },
      });

      if (existing) {
        console.log(
          `⏭️  Skip: ${student.namaLengkap} already submitted ${assignment.jenis} ${assignment.judul}`
        );
        continue;
      }

      // Generate jawaban untuk semua soal
      const answers = assignment.questions.map((q) => generateAnswer(q));

      // Hitung nilai
      const nilai = calculateScore(answers, assignment.questions);

      // Waktu pengerjaan
      const waktuMulai = assignment.TanggalMulai
        ? new Date(assignment.TanggalMulai)
        : new Date();
      const waktuKumpul = assignment.TanggalSelesai
        ? new Date(assignment.TanggalSelesai)
        : new Date(waktuMulai.getTime() + 2 * 60 * 60000); // 2 jam setelah mulai

      const submission = await prisma.submission.create({
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
                  ? question.poin * (0.6 + Math.random() * 0.4)
                  : 0,
            })),
          },
        },
      });

      submissionsCreated++;
      console.log(
        `✅ Created submission for ${student.namaLengkap} - ${assignment.jenis}: ${assignment.judul} (${nilai.toFixed(2)})`
      );
    }
  }

  console.log(`\n🎉 Selesai! Total ${submissionsCreated} submissions created`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });