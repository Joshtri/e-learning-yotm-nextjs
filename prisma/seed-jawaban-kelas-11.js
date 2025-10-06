const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed for Kelas 11 student answers...");

  // Get all students in Kelas 11
  const students = await prisma.student.findMany({
    where: {
      class: { namaKelas: { contains: "11" } },
      status: "ACTIVE",
    },
    select: { id: true, namaLengkap: true },
  });

  console.log(`📚 Found ${students.length} students in Kelas 11`);

  // Get all assignments for Kelas 11 (UTS, UAS, EXERCISE)
  const assignments = await prisma.assignment.findMany({
    where: {
      classSubjectTutor: {
        class: { namaKelas: { contains: "11" } },
      },
      jenis: { in: ["MIDTERM", "FINAL_EXAM", "EXERCISE"] },
      questions: { some: {} }, // Only assignments with questions
    },
    include: {
      questions: {
        include: { options: true },
      },
      classSubjectTutor: {
        include: { subject: true },
      },
    },
  });

  console.log(`📝 Found ${assignments.length} assignments with questions`);

  // Get all quizzes for Kelas 11
  const quizzes = await prisma.quiz.findMany({
    where: {
      classSubjectTutor: {
        class: { namaKelas: { contains: "11" } },
      },
      questions: { some: {} }, // Only quizzes with questions
    },
    include: {
      questions: {
        include: { options: true },
      },
      classSubjectTutor: {
        include: { subject: true },
      },
    },
  });

  console.log(`📝 Found ${quizzes.length} quizzes with questions`);

  // Helper function to generate answer
  const generateAnswer = (question) => {
    if (question.jenis === "MULTIPLE_CHOICE" || question.jenis === "TRUE_FALSE") {
      const correctOption = question.options.find((opt) => opt.adalahBenar);
      const isCorrect = Math.random() < 0.7; // 70% correct rate

      if (isCorrect && correctOption) {
        return {
          jawaban: correctOption.teks,
          adalahBenar: true,
        };
      } else {
        const wrongOptions = question.options.filter((opt) => !opt.adalahBenar);
        if (wrongOptions.length > 0) {
          const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          return {
            jawaban: randomWrong.teks,
            adalahBenar: false,
          };
        }
      }
    } else if (question.jenis === "SHORT_ANSWER") {
      const isCorrect = Math.random() < 0.6;
      if (isCorrect && question.jawabanBenar) {
        return {
          jawaban: question.jawabanBenar,
          adalahBenar: true,
        };
      } else {
        return {
          jawaban: "Jawaban singkat dari siswa",
          adalahBenar: false,
        };
      }
    } else if (question.jenis === "ESSAY") {
      const essays = [
        "Menurut saya, topik ini sangat penting karena berkaitan dengan kehidupan sehari-hari. Saya akan menjelaskan beberapa poin penting...",
        "Berdasarkan pemahaman saya, hal ini dapat dijelaskan sebagai berikut...",
        "Dari berbagai sumber yang saya pelajari, dapat disimpulkan bahwa...",
      ];
      return {
        jawaban: essays[Math.floor(Math.random() * essays.length)],
        adalahBenar: null,
      };
    }

    return { jawaban: "-", adalahBenar: null };
  };

  // Calculate score based on answers
  const calculateScore = (answers, maxScore) => {
    const totalPoin = answers.reduce((sum, ans) => sum + ans.poin, 0);
    const correctPoin = answers.reduce((sum, ans) => {
      if (ans.adalahBenar === true) return sum + ans.poin;
      if (ans.adalahBenar === null) return sum + ans.poin * 0.8; // Essay gets 80%
      return sum;
    }, 0);

    return Math.min((correctPoin / totalPoin) * maxScore, maxScore);
  };

  let totalSubmissions = 0;

  // Create submissions for assignments
  for (const assignment of assignments) {
    console.log(`\n📄 Processing assignment: ${assignment.judul} (${assignment.jenis})`);

    for (const student of students) {
      // Check if submission already exists
      const existing = await prisma.submission.findFirst({
        where: {
          studentId: student.id,
          assignmentId: assignment.id,
        },
      });

      if (existing) {
        console.log(`  ⏭️  ${student.namaLengkap} already has submission`);
        continue;
      }

      // Generate answers for all questions
      const answerData = assignment.questions.map((q) => {
        const answer = generateAnswer(q);
        return {
          questionId: q.id,
          jawaban: answer.jawaban,
          adalahBenar: answer.adalahBenar,
          poin: q.poin,
        };
      });

      // Calculate score
      const score = calculateScore(answerData, assignment.nilaiMaksimal || 100);

      // Create submission with answers
      await prisma.submission.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          status: "GRADED",
          waktuMulai: new Date(assignment.TanggalMulai || "2025-10-01"),
          waktuKumpul: new Date(assignment.TanggalSelesai || "2025-10-15"),
          nilai: score,
          waktuDinilai: new Date(),
          answers: {
            create: answerData.map(({ poin, ...rest }) => rest),
          },
        },
      });

      totalSubmissions++;
    }
  }

  // Create submissions for quizzes
  for (const quiz of quizzes) {
    console.log(`\n📄 Processing quiz: ${quiz.judul}`);

    for (const student of students) {
      // Check if submission already exists
      const existing = await prisma.submission.findFirst({
        where: {
          studentId: student.id,
          quizId: quiz.id,
        },
      });

      if (existing) {
        console.log(`  ⏭️  ${student.namaLengkap} already has submission`);
        continue;
      }

      // Generate answers for all questions
      const answerData = quiz.questions.map((q) => {
        const answer = generateAnswer(q);
        return {
          questionId: q.id,
          jawaban: answer.jawaban,
          adalahBenar: answer.adalahBenar,
          poin: q.poin,
        };
      });

      // Calculate score
      const score = calculateScore(answerData, quiz.nilaiMaksimal || 100);

      // Create submission with answers
      await prisma.submission.create({
        data: {
          studentId: student.id,
          quizId: quiz.id,
          status: "GRADED",
          waktuMulai: quiz.waktuMulai,
          waktuKumpul: new Date(quiz.waktuSelesai),
          nilai: score,
          waktuDinilai: new Date(),
          answers: {
            create: answerData.map(({ poin, ...rest }) => rest),
          },
        },
      });

      totalSubmissions++;
    }
  }

  console.log(`\n✅ Seed completed successfully!`);
  console.log(`📊 Total new submissions created: ${totalSubmissions}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
