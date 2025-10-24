import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to generate random score
function generateRandomScore(min = 60, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to generate realistic score distribution
function generateRealisticScore() {
  const rand = Math.random();

  // 10% excellent (90-100)
  if (rand < 0.1) return generateRandomScore(90, 100);

  // 30% good (80-89)
  if (rand < 0.4) return generateRandomScore(80, 89);

  // 40% average (70-79)
  if (rand < 0.8) return generateRandomScore(70, 79);

  // 15% below average (60-69)
  if (rand < 0.95) return generateRandomScore(60, 69);

  // 5% low (50-59)
  return generateRandomScore(50, 59);
}

async function createNilaiGenapForKelas11() {
  console.log("🌱 Creating Nilai/Submissions for Semester GENAP 2025/2026 - Kelas 11...\n");

  // Get Kelas 11 GENAP
  const kelas11Genap = await prisma.class.findFirst({
    where: {
      namaKelas: "Kelas 11",
      academicYear: {
        tahunMulai: 2025,
        tahunSelesai: 2026,
        semester: "GENAP",
      },
    },
    include: {
      academicYear: true,
      students: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  if (!kelas11Genap) {
    console.log("❌ Kelas 11 Semester GENAP not found");
    return;
  }

  console.log(`✅ Found Kelas 11 GENAP with ${kelas11Genap.students.length} students\n`);

  if (kelas11Genap.students.length === 0) {
    console.log("❌ No students found in Kelas 11 GENAP");
    return;
  }

  // Get all assignments and quizzes for this class in GENAP semester
  const assignments = await prisma.assignment.findMany({
    where: {
      classSubjectTutor: {
        class: {
          academicYearId: kelas11Genap.academicYearId,
        },
      },
    },
    include: {
      classSubjectTutor: {
        include: {
          subject: true,
        },
      },
      questions: true,
    },
  });

  const quizzes = await prisma.quiz.findMany({
    where: {
      classSubjectTutor: {
        class: {
          academicYearId: kelas11Genap.academicYearId,
        },
      },
    },
    include: {
      classSubjectTutor: {
        include: {
          subject: true,
        },
      },
      questions: true,
    },
  });

  console.log(`📊 Found ${assignments.length} assignments and ${quizzes.length} quizzes\n`);

  let submissionCount = 0;

  // Create submissions for assignments
  for (const assignment of assignments) {
    console.log(`  Processing: ${assignment.judul} (${assignment.jenis})`);

    for (const student of kelas11Genap.students) {
      const nilai = generateRealisticScore();

      const randomTime = assignment.TanggalMulai.getTime() + Math.random() * (assignment.TanggalSelesai - assignment.TanggalMulai);
      const waktuKumpul = new Date(randomTime);
      const waktuDinilai = new Date(randomTime + (1000 * 60 * 60 * 24)); // 1 day after submission

      await prisma.submission.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          nilai: nilai,
          status: "GRADED",
          waktuMulai: assignment.TanggalMulai,
          waktuKumpul: waktuKumpul,
          waktuDinilai: waktuDinilai,
        },
      });

      submissionCount++;
    }

    console.log(`    ✓ Created ${kelas11Genap.students.length} submissions`);
  }

  // Create submissions for quizzes
  for (const quiz of quizzes) {
    console.log(`  Processing: ${quiz.judul}`);

    for (const student of kelas11Genap.students) {
      const nilai = generateRealisticScore();

      const randomTime = quiz.tanggalMulai.getTime() + Math.random() * (quiz.tanggalSelesai - quiz.tanggalMulai);
      const waktuKumpul = new Date(randomTime);
      const waktuDinilai = new Date(randomTime + (1000 * 60 * 60 * 24)); // 1 day after submission

      await prisma.submission.create({
        data: {
          studentId: student.id,
          quizId: quiz.id,
          nilai: nilai,
          status: "GRADED",
          waktuMulai: quiz.tanggalMulai,
          waktuKumpul: waktuKumpul,
          waktuDinilai: waktuDinilai,
        },
      });

      submissionCount++;
    }

    console.log(`    ✓ Created ${kelas11Genap.students.length} submissions`);
  }

  console.log(`\n✅ Created total ${submissionCount} submissions for Semester GENAP\n`);

  // Create Behavior Scores
  console.log("📊 Creating Behavior Scores...\n");

  let behaviorCount = 0;

  for (const student of kelas11Genap.students) {
    // Check if behavior score already exists
    const existingBehavior = await prisma.behaviorScore.findFirst({
      where: {
        studentId: student.id,
        classId: kelas11Genap.id,
        academicYearId: kelas11Genap.academicYearId,
      },
    });

    if (!existingBehavior) {
      await prisma.behaviorScore.create({
        data: {
          spiritual: generateRandomScore(70, 95),
          sosial: generateRandomScore(70, 95),
          kehadiran: generateRandomScore(75, 100),
          student: {
            connect: { id: student.id },
          },
          class: {
            connect: { id: kelas11Genap.id },
          },
          academicYear: {
            connect: { id: kelas11Genap.academicYearId },
          },
        },
      });

      behaviorCount++;
    } else {
      console.log(`    ⚠ Behavior score already exists for student ${student.namaLengkap}`);
    }
  }

  console.log(`✅ Created ${behaviorCount} behavior scores\n`);

  // Create Skill Scores
  console.log("📊 Creating Skill Scores...\n");

  // Get all subjects for this class
  const classSubjectTutors = await prisma.classSubjectTutor.findMany({
    where: {
      class: {
        academicYearId: kelas11Genap.academicYearId,
      },
    },
    include: {
      subject: true,
    },
  });

  let skillCount = 0;

  for (const student of kelas11Genap.students) {
    for (const cst of classSubjectTutors) {
      // Check if skill score already exists
      const existingSkill = await prisma.skillScore.findFirst({
        where: {
          studentId: student.id,
          subjectId: cst.subjectId,
        },
      });

      if (!existingSkill) {
        await prisma.skillScore.create({
          data: {
            nilai: generateRandomScore(70, 95),
            keterangan: `Nilai keterampilan ${cst.subject.namaMapel} - Semester GENAP`,
            student: {
              connect: { id: student.id },
            },
            subject: {
              connect: { id: cst.subjectId },
            },
          },
        });

        skillCount++;
      }
    }
  }

  console.log(`✅ Created ${skillCount} skill scores\n`);
}

async function main() {
  try {
    await createNilaiGenapForKelas11();
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
    console.log("✅ Nilai seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
