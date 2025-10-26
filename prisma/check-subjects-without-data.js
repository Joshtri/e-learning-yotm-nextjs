import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking subjects without assignments/quizzes...\n");

  // Fetch academic year aktif
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      tahunMulai: 2025,
      tahunSelesai: 2026,
      semester: "GENAP",
      isActive: true,
    },
  });

  if (!academicYear) {
    console.log("❌ Academic Year Genap 2025-2026 tidak ditemukan");
    return;
  }

  console.log(`✅ Academic Year: ${academicYear.tahunMulai}-${academicYear.tahunSelesai} ${academicYear.semester}\n`);

  // Fetch semua ClassSubjectTutor untuk semester aktif
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
      assignments: {
        select: {
          id: true,
          jenis: true,
        },
      },
      quizzes: {
        select: {
          id: true,
        },
      },
    },
  });

  console.log(`📚 Total ClassSubjectTutor mappings: ${classSubjectTutors.length}\n`);

  // Group by subject
  const subjectStats = {};

  classSubjectTutors.forEach((cst) => {
    const subjectName = cst.subject.namaMapel;

    if (!subjectStats[subjectName]) {
      subjectStats[subjectName] = {
        subjectId: cst.subject.id,
        classSubjectTutors: [],
        totalAssignments: 0,
        totalQuizzes: 0,
        hasUTS: false,
        hasUAS: false,
        hasTugas: false,
        hasUjianHarian: false,
        hasKuis: false,
      };
    }

    subjectStats[subjectName].classSubjectTutors.push({
      id: cst.id,
      tutor: cst.tutor.namaLengkap,
      class: cst.class.namaKelas,
      students: cst.class.students.length,
    });

    subjectStats[subjectName].totalAssignments += cst.assignments.length;
    subjectStats[subjectName].totalQuizzes += cst.quizzes.length;

    // Check assignment types
    cst.assignments.forEach((asn) => {
      if (asn.jenis === "MIDTERM") subjectStats[subjectName].hasUTS = true;
      if (asn.jenis === "FINAL_EXAM") subjectStats[subjectName].hasUAS = true;
      if (asn.jenis === "EXERCISE") subjectStats[subjectName].hasTugas = true;
      if (asn.jenis === "DAILY_TEST") subjectStats[subjectName].hasUjianHarian = true;
    });

    if (cst.quizzes.length > 0) subjectStats[subjectName].hasKuis = true;
  });

  // Display results
  console.log("=" .repeat(100));
  console.log("SUBJECTS WITH COMPLETE DATA:");
  console.log("=" .repeat(100));

  Object.entries(subjectStats)
    .filter(([_, stats]) =>
      stats.hasUTS && stats.hasUAS && stats.hasTugas && stats.hasUjianHarian && stats.hasKuis
    )
    .forEach(([subjectName, stats]) => {
      console.log(`\n✅ ${subjectName}`);
      console.log(`   Assignments: ${stats.totalAssignments} | Quizzes: ${stats.totalQuizzes}`);
      console.log(`   UTS: ✅ | UAS: ✅ | Tugas: ✅ | Ujian Harian: ✅ | Kuis: ✅`);
      console.log(`   Classes:`);
      stats.classSubjectTutors.forEach((cst) => {
        console.log(`      - ${cst.class} | Tutor: ${cst.tutor} | Students: ${cst.students}`);
      });
    });

  console.log("\n" + "=".repeat(100));
  console.log("SUBJECTS WITH INCOMPLETE DATA:");
  console.log("=" .repeat(100));

  const incompleteSubjects = Object.entries(subjectStats)
    .filter(([_, stats]) =>
      !stats.hasUTS || !stats.hasUAS || !stats.hasTugas || !stats.hasUjianHarian || !stats.hasKuis
    );

  incompleteSubjects.forEach(([subjectName, stats]) => {
    console.log(`\n⚠️  ${subjectName}`);
    console.log(`   Assignments: ${stats.totalAssignments} | Quizzes: ${stats.totalQuizzes}`);
    console.log(`   UTS: ${stats.hasUTS ? '✅' : '❌'} | UAS: ${stats.hasUAS ? '✅' : '❌'} | Tugas: ${stats.hasTugas ? '✅' : '❌'} | Ujian Harian: ${stats.hasUjianHarian ? '✅' : '❌'} | Kuis: ${stats.hasKuis ? '✅' : '❌'}`);
    console.log(`   Classes:`);
    stats.classSubjectTutors.forEach((cst) => {
      console.log(`      - ${cst.class} | Tutor: ${cst.tutor} | Students: ${cst.students} (CST ID: ${cst.id})`);
    });
  });

  console.log("\n" + "=".repeat(100));
  console.log("\n📊 SUMMARY:");
  console.log(`   Total Subjects: ${Object.keys(subjectStats).length}`);
  console.log(`   Complete: ${Object.keys(subjectStats).length - incompleteSubjects.length}`);
  console.log(`   Incomplete: ${incompleteSubjects.length}`);

  // Export incomplete subjects untuk seed
  console.log("\n\n📝 SUBJECTS THAT NEED SEEDING:");
  incompleteSubjects.forEach(([subjectName, stats]) => {
    console.log(`   - ${subjectName} (ID: ${stats.subjectId})`);
  });

  console.log("\n✅ Check complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
