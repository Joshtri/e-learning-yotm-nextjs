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
        "Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
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

async function main() {
  console.log("🌱 Starting seed for missing submissions and skill scores...\n");

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

  // ==================== PART 1: GENERATE MISSING SUBMISSIONS ====================
  console.log("=".repeat(80));
  console.log("PART 1: GENERATING MISSING SUBMISSIONS");
  console.log("=".repeat(80) + "\n");

  // Fetch all assignments with 0 submissions
  const assignmentsNeedingSubmissions = await prisma.assignment.findMany({
    where: {
      classSubjectTutor: {
        class: {
          academicYearId: academicYear.id,
        },
      },
    },
    include: {
      classSubjectTutor: {
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
        },
      },
      questions: {
        include: {
          options: true,
        },
      },
      submissions: true,
    },
  });

  let totalSubmissionsCreated = 0;

  for (const assignment of assignmentsNeedingSubmissions) {
    const students = assignment.classSubjectTutor.class.students;
    const existingSubmissions = assignment.submissions;

    // Skip if already has submissions
    if (existingSubmissions.length >= students.length) {
      continue;
    }

    console.log(`📝 ${assignment.jenis} | ${assignment.judul}`);
    console.log(`   Subject: ${assignment.classSubjectTutor.subject.namaMapel}`);
    console.log(`   Class: ${assignment.classSubjectTutor.class.namaKelas}`);
    console.log(`   Existing: ${existingSubmissions.length} | Need: ${students.length - existingSubmissions.length}\n`);

    // Get students who haven't submitted
    const submittedStudentIds = existingSubmissions.map((s) => s.studentId);
    const studentsNeedingSubmission = students.filter(
      (s) => !submittedStudentIds.includes(s.id)
    );

    if (studentsNeedingSubmission.length === 0) {
      console.log(`   ✅ All students already submitted\n`);
      continue;
    }

    // Generate submissions for missing students
    for (const student of studentsNeedingSubmission) {
      const answers = assignment.questions.map((q) => generateAnswer(q));
      const nilai = calculateScore(answers, assignment.questions);

      // Determine waktu based on assignment type
      let waktuMulai, waktuKumpul;
      if (assignment.TanggalMulai) {
        waktuMulai = new Date(assignment.TanggalMulai);
        waktuMulai.setHours(8, 0, 0);

        if (assignment.batasWaktuMenit) {
          waktuKumpul = new Date(
            waktuMulai.getTime() + Math.random() * assignment.batasWaktuMenit * 60000
          );
        } else {
          waktuKumpul = new Date(assignment.TanggalSelesai || waktuMulai);
          waktuKumpul.setHours(15, 30, 0);
        }
      } else {
        waktuMulai = new Date();
        waktuKumpul = new Date(waktuMulai.getTime() + 2 * 60 * 60000);
      }

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

      totalSubmissionsCreated++;
    }

    console.log(`   ✅ Created ${studentsNeedingSubmission.length} submissions\n`);
  }

  console.log(`📊 Total submissions created: ${totalSubmissionsCreated}\n`);

  // ==================== PART 2: GENERATE SKILL SCORES ====================
  console.log("=".repeat(80));
  console.log("PART 2: GENERATING SKILL SCORES");
  console.log("=".repeat(80) + "\n");

  // Fetch all students in active classes
  const classes = await prisma.class.findMany({
    where: {
      academicYearId: academicYear.id,
    },
    include: {
      students: {
        where: {
          status: "ACTIVE",
        },
      },
      classSubjectTutors: {
        include: {
          subject: true,
        },
      },
    },
  });

  let totalSkillScoresCreated = 0;

  for (const kelas of classes) {
    console.log(`\n📚 Class: ${kelas.namaKelas} (${kelas.students.length} students)`);

    for (const cst of kelas.classSubjectTutors) {
      const subjectName = cst.subject.namaMapel;
      console.log(`   Subject: ${subjectName}`);

      for (const student of kelas.students) {
        // Check if skill score already exists
        const existingSkillScore = await prisma.skillScore.findUnique({
          where: {
            studentId_subjectId: {
              studentId: student.id,
              subjectId: cst.subjectId,
            },
          },
        });

        if (existingSkillScore) {
          continue;
        }

        // Generate realistic skill score (65-98)
        const nilai = 65 + Math.random() * 33;

        // Generate keterangan based on subject
        let keterangan = "";
        if (subjectName.includes("Jasmani") || subjectName.includes("PJOK")) {
          const activities = [
            "Praktik Lari 100m",
            "Praktik Lompat Jauh",
            "Praktik Bola Voli",
            "Praktik Bola Basket",
            "Praktik Senam",
            "Tes Kebugaran Jasmani",
          ];
          keterangan = activities[Math.floor(Math.random() * activities.length)];
        } else if (subjectName.includes("Seni")) {
          const activities = [
            "Praktik Menyanyi",
            "Praktik Menggambar",
            "Praktik Tari Tradisional",
            "Praktik Musik Angklung",
            "Karya Seni Rupa",
          ];
          keterangan = activities[Math.floor(Math.random() * activities.length)];
        } else if (subjectName.includes("TIK") || subjectName.includes("Teknologi Informasi")) {
          const activities = [
            "Praktik Microsoft Excel",
            "Praktik Microsoft Word",
            "Praktik PowerPoint",
            "Praktik Programming",
            "Praktik Desain Grafis",
          ];
          keterangan = activities[Math.floor(Math.random() * activities.length)];
        } else if (subjectName.includes("Bahasa Inggris")) {
          const activities = [
            "Praktik Speaking",
            "Praktik Listening",
            "Praktik Writing",
            "Praktik Reading Comprehension",
            "Praktik Conversation",
          ];
          keterangan = activities[Math.floor(Math.random() * activities.length)];
        } else if (subjectName.includes("Bahasa Indonesia")) {
          const activities = [
            "Praktik Membaca Puisi",
            "Praktik Pidato",
            "Praktik Menulis Cerpen",
            "Praktik Debat",
            "Praktik Drama",
          ];
          keterangan = activities[Math.floor(Math.random() * activities.length)];
        } else {
          keterangan = `Praktik ${subjectName}`;
        }

        await prisma.skillScore.create({
          data: {
            studentId: student.id,
            subjectId: cst.subjectId,
            nilai: parseFloat(nilai.toFixed(2)),
            keterangan,
          },
        });

        totalSkillScoresCreated++;
      }

      console.log(`      ✅ Created ${kelas.students.length} skill scores`);
    }
  }

  console.log(`\n📊 Total skill scores created: ${totalSkillScoresCreated}\n`);

  // ==================== SUMMARY ====================
  console.log("=".repeat(80));
  console.log("🎉 SEEDING COMPLETED!");
  console.log("=".repeat(80));
  console.log(`Total Submissions Created: ${totalSubmissionsCreated}`);
  console.log(`Total Skill Scores Created: ${totalSkillScoresCreated}`);
  console.log("\n✅ All missing data has been generated!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
