import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying submissions for Penjas & TIK...\n");

  // Fetch tutor Erna
  const tutor = await prisma.tutor.findFirst({
    where: {
      namaLengkap: {
        contains: "Erna",
        mode: "insensitive",
      },
    },
  });

  if (!tutor) {
    console.log("❌ Tutor Erna not found");
    return;
  }

  // Fetch subjects
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

  console.log(`📚 Subjects: ${subjects.map(s => s.namaMapel).join(", ")}\n`);

  // Check assignments
  const assignments = await prisma.assignment.findMany({
    where: {
      classSubjectTutor: {
        tutorId: tutor.id,
        subjectId: {
          in: subjects.map(s => s.id),
        },
      },
    },
    include: {
      classSubjectTutor: {
        include: {
          subject: true,
          class: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  console.log("📝 ASSIGNMENTS:");
  assignments.forEach((asn) => {
    console.log(
      `   ${asn.jenis.padEnd(15)} | ${asn.judul.substring(0, 50).padEnd(50)} | ${asn._count.submissions} submissions`
    );
  });

  // Check quizzes
  const quizzes = await prisma.quiz.findMany({
    where: {
      classSubjectTutor: {
        tutorId: tutor.id,
        subjectId: {
          in: subjects.map(s => s.id),
        },
      },
    },
    include: {
      classSubjectTutor: {
        include: {
          subject: true,
          class: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  console.log("\n📝 QUIZZES:");
  quizzes.forEach((quiz) => {
    console.log(
      `   ${quiz.judul.substring(0, 50).padEnd(50)} | ${quiz._count.submissions} submissions`
    );
  });

  // Get sample submissions with scores
  console.log("\n📊 SAMPLE SUBMISSIONS (First 5 from each type):");

  for (const asn of assignments.slice(0, 1)) {
    const sampleSubmissions = await prisma.submission.findMany({
      where: {
        assignmentId: asn.id,
      },
      take: 5,
      include: {
        student: true,
      },
      orderBy: {
        nilai: 'desc',
      },
    });

    console.log(`\n   ${asn.jenis} - ${asn.judul}:`);
    sampleSubmissions.forEach((sub) => {
      console.log(
        `      ${sub.student.namaLengkap.padEnd(30)} | Score: ${sub.nilai?.toFixed(2) || 'N/A'} | Status: ${sub.status}`
      );
    });
  }

  // Statistics
  const totalSubmissions = await prisma.submission.count({
    where: {
      OR: [
        {
          assignment: {
            classSubjectTutor: {
              tutorId: tutor.id,
              subjectId: {
                in: subjects.map(s => s.id),
              },
            },
          },
        },
        {
          quiz: {
            classSubjectTutor: {
              tutorId: tutor.id,
              subjectId: {
                in: subjects.map(s => s.id),
              },
            },
          },
        },
      ],
    },
  });

  const avgScore = await prisma.submission.aggregate({
    where: {
      OR: [
        {
          assignment: {
            classSubjectTutor: {
              tutorId: tutor.id,
              subjectId: {
                in: subjects.map(s => s.id),
              },
            },
          },
        },
        {
          quiz: {
            classSubjectTutor: {
              tutorId: tutor.id,
              subjectId: {
                in: subjects.map(s => s.id),
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
  });

  console.log("\n\n📊 STATISTICS:");
  console.log(`   Total Submissions: ${totalSubmissions}`);
  console.log(`   Average Score: ${avgScore._avg.nilai?.toFixed(2) || 'N/A'}`);
  console.log(`   Total Assignments: ${assignments.length}`);
  console.log(`   Total Quizzes: ${quizzes.length}`);

  console.log("\n✅ Verification complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
