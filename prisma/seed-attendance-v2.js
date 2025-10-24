import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedAttendance() {
  console.log("🌱 Seeding attendance data for September & October 2025...\n");

  try {
    // Get Kelas 11 and academic year 2025/2026
    const kelas = await prisma.class.findFirst({
      where: {
        namaKelas: "Kelas 11",
        academicYear: {
          tahunMulai: 2025,
          tahunSelesai: 2026,
          isActive: true,
          semester: "GENAP",
        },
      },
      include: {
        academicYear: true,
        students: {
          select: {
            id: true,
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
        homeroomTeacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!kelas) {
      console.log("❌ Kelas 11 tidak ditemukan");
      return;
    }

    console.log(`📚 Kelas: ${kelas.namaKelas}`);
    console.log(`👨‍🏫 Wali Kelas: ${kelas.homeroomTeacher?.user?.nama || "Belum ada"}`);
    console.log(`👥 Jumlah Siswa: ${kelas.students.length}\n`);

    if (!kelas.homeroomTeacher) {
      console.log("❌ Kelas belum memiliki wali kelas");
      return;
    }

    if (kelas.students.length === 0) {
      console.log("❌ Kelas tidak memiliki siswa");
      return;
    }

    // ========== DEFINE ATTENDANCE RULES ==========
    const attendanceRules = {
      september: {
        hadir: [
          ...Array.from({ length: 4 }, (_, i) => i + 1), // 1-4
          ...Array.from({ length: 8 }, (_, i) => i + 6), // 6-13
          ...Array.from({ length: 6 }, (_, i) => i + 15), // 15-20
          ...Array.from({ length: 6 }, (_, i) => i + 22), // 22-27
          29, 30, // 29-30
        ],
        libur: [5], // Tanggal 5 libur
      },
      oktober: {
        hadir: [1, 2, 3, 4], // 1-4
        libur: [],
      },
    };

    console.log("📅 Attendance Rules:");
    console.log(`   September - Hadir: ${attendanceRules.september.hadir.join(", ")}`);
    console.log(`   September - Libur: ${attendanceRules.september.libur.join(", ")}`);
    console.log(`   Oktober - Hadir: ${attendanceRules.oktober.hadir.join(", ")}\n`);

    // ========== PROCESS SEPTEMBER ==========
    console.log("📆 Processing September 2025...\n");
    await processMonth(
      kelas,
      2025,
      9, // September (month index 8)
      30,
      attendanceRules.september
    );

    // ========== PROCESS OKTOBER ==========
    console.log("\n📆 Processing Oktober 2025...\n");
    await processMonth(
      kelas,
      2025,
      10, // Oktober (month index 9)
      31,
      attendanceRules.oktober
    );

    console.log("\n🎉 Attendance seeding completed!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

async function processMonth(kelas, year, monthNumber, daysInMonth, rules) {
  const monthIndex = monthNumber - 1; // Convert to 0-indexed
  const monthName = new Date(year, monthIndex, 1).toLocaleString("id-ID", {
    month: "long",
  });

  // Check existing sessions
  const existingSessions = await prisma.attendanceSession.findMany({
    where: {
      classId: kelas.id,
      academicYearId: kelas.academicYearId,
      tanggal: {
        gte: new Date(year, monthIndex, 1),
        lte: new Date(year, monthIndex, daysInMonth),
      },
    },
    orderBy: {
      tanggal: "asc",
    },
  });

  console.log(
    `   Found ${existingSessions.length} existing sessions for ${monthName} ${year}`
  );

  // Create sessions if needed
  if (existingSessions.length === 0) {
    console.log(`   Creating sessions for ${monthName}...\n`);

    const sessionsToCreate = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const dayOfWeek = date.getDay();

      // Skip Sundays
      if (dayOfWeek === 0) {
        console.log(`     ⏭️  Skipping Sunday: ${monthName} ${day}`);
        continue;
      }

      // Skip holidays defined in rules
      if (rules.libur && rules.libur.includes(day)) {
        console.log(`     🎉 Skipping holiday: ${monthName} ${day}`);
        continue;
      }

      sessionsToCreate.push({
        tutorId: kelas.homeroomTeacher.id,
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal: date,
        keterangan: `Presensi ${monthName} ${year}`,
      });
    }

    if (sessionsToCreate.length > 0) {
      await prisma.attendanceSession.createMany({
        data: sessionsToCreate,
        skipDuplicates: true,
      });

      console.log(`   ✅ Created ${sessionsToCreate.length} sessions\n`);

      // Re-fetch sessions
      const createdSessions = await prisma.attendanceSession.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          tanggal: {
            gte: new Date(year, monthIndex, 1),
            lte: new Date(year, monthIndex, daysInMonth),
          },
        },
        orderBy: {
          tanggal: "asc",
        },
      });

      // Create attendance records (default ABSENT)
      const attendanceRecords = [];
      for (const session of createdSessions) {
        for (const student of kelas.students) {
          attendanceRecords.push({
            studentId: student.id,
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
            date: session.tanggal,
            attendanceSessionId: session.id,
            status: "ABSENT",
          });
        }
      }

      await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });

      console.log(`   ✅ Created ${attendanceRecords.length} attendance records\n`);
    }
  }

  // Update attendance status based on rules
  console.log(`   📝 Updating attendance to PRESENT (HADIR)...\n`);

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      classId: kelas.id,
      academicYearId: kelas.academicYearId,
      tanggal: {
        gte: new Date(year, monthIndex, 1),
        lte: new Date(year, monthIndex, daysInMonth),
      },
    },
    orderBy: {
      tanggal: "asc",
    },
  });

  let updatedCount = 0;

  for (const day of rules.hadir) {
    const session = sessions.find(
      (s) => s.tanggal.getDate() === day && s.tanggal.getMonth() === monthIndex
    );

    if (session) {
      const result = await prisma.attendance.updateMany({
        where: {
          attendanceSessionId: session.id,
        },
        data: {
          status: "PRESENT",
        },
      });

      updatedCount += result.count;
      console.log(
        `     ✓ ${monthName} ${day}: ${result.count} students → HADIR`
      );
    } else {
      console.log(
        `     ⚠️  ${monthName} ${day}: Session not found (might be Sunday/holiday)`
      );
    }
  }

  console.log(`\n   ✅ ${monthName}: ${updatedCount} attendance records updated to HADIR`);
}

seedAttendance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
