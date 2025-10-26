import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying Skill Scores...\n");

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

  console.log(`📚 Academic Year: ${academicYear.tahunMulai}-${academicYear.tahunSelesai} ${academicYear.semester}\n`);

  // Get all subjects with skill scores
  const subjects = await prisma.subject.findMany({
    include: {
      classSubjectTutors: {
        where: {
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
        },
      },
      SkillScore: {
        include: {
          student: true,
        },
      },
    },
  });

  const activeSubjects = subjects.filter((s) => s.classSubjectTutors.length > 0);

  console.log("=".repeat(100));
  console.log("SKILL SCORES BY SUBJECT");
  console.log("=".repeat(100) + "\n");

  let totalSkillScores = 0;
  let totalStudents = 0;

  activeSubjects.forEach((subject) => {
    const skillScores = subject.SkillScore;

    subject.classSubjectTutors.forEach((cst) => {
      const students = cst.class.students;
      totalStudents = students.length; // Should be same for all

      console.log(`📚 ${subject.namaMapel}`);
      console.log(`   Class: ${cst.class.namaKelas}`);
      console.log(`   Total Students: ${students.length}`);
      console.log(`   Skill Scores: ${skillScores.length}`);

      if (skillScores.length > 0) {
        const scores = skillScores.map((s) => s.nilai);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);

        console.log(`   Average: ${avgScore.toFixed(2)} | Min: ${minScore.toFixed(2)} | Max: ${maxScore.toFixed(2)}`);

        // Show sample scores
        console.log(`   Sample Scores (first 3):`);
        skillScores.slice(0, 3).forEach((s) => {
          console.log(`      - ${s.student.namaLengkap.padEnd(30)} | ${s.nilai.toFixed(2)} | ${s.keterangan}`);
        });
      } else {
        console.log(`   ❌ NO SKILL SCORES!`);
      }

      console.log();
      totalSkillScores += skillScores.length;
    });
  });

  // Overall statistics
  console.log("=".repeat(100));
  console.log("📊 OVERALL STATISTICS");
  console.log("=".repeat(100));
  console.log(`Total Subjects: ${activeSubjects.length}`);
  console.log(`Total Students: ${totalStudents}`);
  console.log(`Total Skill Scores: ${totalSkillScores}`);
  console.log(`Expected Skill Scores: ${activeSubjects.length * totalStudents}`);

  if (totalSkillScores === activeSubjects.length * totalStudents) {
    console.log("\n✅ ALL STUDENTS HAVE SKILL SCORES FOR ALL SUBJECTS!");
  } else {
    console.log(`\n⚠️  Missing ${activeSubjects.length * totalStudents - totalSkillScores} skill scores`);
  }

  // Check for duplicates
  const duplicateCheck = await prisma.$queryRaw`
    SELECT "subjectId", "studentId", COUNT(*) as count
    FROM "SkillScore"
    GROUP BY "subjectId", "studentId"
    HAVING COUNT(*) > 1
  `;

  if (duplicateCheck.length > 0) {
    console.log(`\n⚠️  Found ${duplicateCheck.length} duplicate skill scores`);
  } else {
    console.log("\n✅ No duplicate skill scores found!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
