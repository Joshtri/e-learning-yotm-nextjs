import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== CHECKING DATABASE ===\n");

    // Check Classes
    const classes = await prisma.class.findMany({
      include: {
        program: true,
        academicYear: true,
      },
    });
    console.log("📚 CLASSES:");
    classes.forEach((c) => {
      console.log(
        `  - ${c.namaKelas} (${c.program.namaPaket}) - ${c.academicYear.tahunMulai}/${c.academicYear.tahunSelesai}`
      );
    });

    // Check Subjects
    const subjects = await prisma.subject.findMany();
    console.log("\n📖 SUBJECTS:");
    subjects.forEach((s) => {
      console.log(`  - ${s.namaMapel} (${s.kodeMapel})`);
    });

    // Check ClassSubjectTutor
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      include: {
        tutor: { include: { user: true } },
        class: true,
        subject: true,
      },
    });
    console.log("\n👨‍🏫 CLASS-SUBJECT-TUTOR RELATIONSHIPS:");
    classSubjectTutors.forEach((cst) => {
      console.log(
        `  - ${cst.class.namaKelas} | ${cst.subject.namaMapel} | ${cst.tutor.user.nama}`
      );
      console.log(`    ID: ${cst.id}`);
    });

    // Check existing Quizzes
    const quizzes = await prisma.quiz.findMany();
    console.log(`\n📝 EXISTING QUIZZES: ${quizzes.length}`);

    // Check existing Assignments
    const assignments = await prisma.assignment.findMany();
    console.log(`📋 EXISTING ASSIGNMENTS: ${assignments.length}`);

    console.log("\n=== DATABASE CHECK COMPLETE ===");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
