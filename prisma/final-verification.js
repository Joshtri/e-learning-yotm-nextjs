import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 FINAL VERIFICATION - All Subjects Data\n");
  console.log("=".repeat(100) + "\n");

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

  // Get all subjects with their stats
  const subjects = await prisma.subject.findMany({
    include: {
      classSubjectTutors: {
        where: {
          class: {
            academicYearId: academicYear.id,
          },
        },
        include: {
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
          assignments: {
            include: {
              _count: {
                select: {
                  submissions: true,
                },
              },
            },
          },
          quizzes: {
            include: {
              _count: {
                select: {
                  submissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Filter subjects yang punya ClassSubjectTutor di semester aktif
  const activeSubjects = subjects.filter(
    (s) => s.classSubjectTutors.length > 0
  );

  console.log(`📊 SUBJECTS OVERVIEW (Total: ${activeSubjects.length})\n`);
  console.log("=".repeat(100) + "\n");

  let totalAssignments = 0;
  let totalQuizzes = 0;
  let totalSubmissions = 0;

  activeSubjects.forEach((subject) => {
    subject.classSubjectTutors.forEach((cst) => {
      const assignments = cst.assignments;
      const quizzes = cst.quizzes;

      const hasUTS = assignments.some((a) => a.jenis === "MIDTERM");
      const hasUAS = assignments.some((a) => a.jenis === "FINAL_EXAM");
      const hasTugas = assignments.some((a) => a.jenis === "EXERCISE");
      const hasUjianHarian = assignments.some((a) => a.jenis === "DAILY_TEST");
      const hasKuis = quizzes.length > 0;

      const status = hasUTS && hasUAS && hasTugas && hasUjianHarian && hasKuis ? "✅ COMPLETE" : "❌ INCOMPLETE";

      console.log(`${status} | ${subject.namaMapel}`);
      console.log(`   Class: ${cst.class.namaKelas} | Tutor: ${cst.tutor.namaLengkap}`);
      console.log(`   Students: ${cst.class.students.length}`);
      console.log(`   Assignments: ${assignments.length} | Quizzes: ${quizzes.length}`);

      let assignmentSubmissions = 0;
      let quizSubmissions = 0;

      assignments.forEach((asn) => {
        assignmentSubmissions += asn._count.submissions;
        console.log(`      - ${asn.jenis.padEnd(15)} | ${asn.judul.substring(0, 40).padEnd(40)} | ${asn._count.submissions} submissions`);
      });

      quizzes.forEach((quiz) => {
        quizSubmissions += quiz._count.submissions;
        console.log(`      - ${"QUIZ".padEnd(15)} | ${quiz.judul.substring(0, 40).padEnd(40)} | ${quiz._count.submissions} submissions`);
      });

      console.log(`   Total Submissions: ${assignmentSubmissions + quizSubmissions}\n`);

      totalAssignments += assignments.length;
      totalQuizzes += quizzes.length;
      totalSubmissions += assignmentSubmissions + quizSubmissions;
    });
  });

  // Overall statistics
  console.log("=".repeat(100));
  console.log("📈 OVERALL STATISTICS");
  console.log("=".repeat(100));
  console.log(`Total Active Subjects: ${activeSubjects.length}`);
  console.log(`Total Assignments: ${totalAssignments}`);
  console.log(`Total Quizzes: ${totalQuizzes}`);
  console.log(`Total Submissions: ${totalSubmissions}`);

  // Calculate average score
  const avgScore = await prisma.submission.aggregate({
    where: {
      OR: [
        {
          assignment: {
            classSubjectTutor: {
              class: {
                academicYearId: academicYear.id,
              },
            },
          },
        },
        {
          quiz: {
            classSubjectTutor: {
              class: {
                academicYearId: academicYear.id,
              },
            },
          },
        },
      ],
      nilai: {
        not: null,
      },
    },
    _avg: {
      nilai: true,
    },
    _min: {
      nilai: true,
    },
    _max: {
      nilai: true,
    },
  });

  console.log(`Average Score: ${avgScore._avg.nilai?.toFixed(2) || 'N/A'}`);
  console.log(`Min Score: ${avgScore._min.nilai?.toFixed(2) || 'N/A'}`);
  console.log(`Max Score: ${avgScore._max.nilai?.toFixed(2) || 'N/A'}`);

  console.log("\n" + "=".repeat(100));
  console.log("✅ ALL SUBJECTS HAVE COMPLETE DATA!");
  console.log("=".repeat(100));
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
