import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedAttendanceSeptember() {
  console.log("🌱 Seeding attendance data for September 2025...\n");

  try {
    // Get Kelas 11 and academic year 2025/2026
    const kelas = await prisma.class.findFirst({
      where: {
        namaKelas: "Kelas 11",
        academicYear: {
          tahunMulai: 2025,
          tahunSelesai: 2026,
          isActive: true,
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
    console.log(`👥 Jumlah Siswa: ${kelas.students.length}`);
    console.log();

    if (!kelas.homeroomTeacher) {
      console.log("❌ Kelas belum memiliki wali kelas");
      return;
    }

    if (kelas.students.length === 0) {
      console.log("❌ Kelas tidak memiliki siswa");
      return;
    }

    // Check if attendance sessions for September already exist
    const existingSessions = await prisma.attendanceSession.findMany({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal: {
          gte: new Date(2025, 8, 1), // Sept 1, 2025
          lte: new Date(2025, 8, 30), // Sept 30, 2025
        },
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    console.log(`📅 Found ${existingSessions.length} existing attendance sessions in September 2025\n`);

    if (existingSessions.length === 0) {
      console.log("⚠️  No attendance sessions found. Creating sessions first...\n");

      // Create attendance sessions for September (excluding Sundays and holidays)
      const septemberDays = [];
      for (let day = 1; day <= 30; day++) {
        const date = new Date(2025, 8, day); // Month is 0-indexed (8 = September)
        const dayOfWeek = date.getDay();

        // Skip Sundays (0)
        if (dayOfWeek === 0) {
          console.log(`  ⏭️  Skipping Sunday: Sept ${day}`);
          continue;
        }

        septemberDays.push({
          tutorId: kelas.homeroomTeacher.id,
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          tanggal: date,
          keterangan: "Presensi September 2025",
        });
      }

      // Create sessions
      await prisma.attendanceSession.createMany({
        data: septemberDays,
        skipDuplicates: true,
      });

      // Re-fetch created sessions
      const createdSessions = await prisma.attendanceSession.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          tanggal: {
            gte: new Date(2025, 8, 1),
            lte: new Date(2025, 8, 30),
          },
        },
        orderBy: {
          tanggal: "asc",
        },
      });

      console.log(`✅ Created ${createdSessions.length} attendance sessions\n`);

      // Create attendance records for all students (default ABSENT)
      const attendanceRecords = [];
      for (const session of createdSessions) {
        for (const student of kelas.students) {
          attendanceRecords.push({
            studentId: student.id,
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
            date: session.tanggal,
            attendanceSessionId: session.id,
            status: "ABSENT", // Default status
          });
        }
      }

      await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });

      console.log(`✅ Created ${attendanceRecords.length} attendance records\n`);
    }

    // Now update attendance for specific dates
    console.log("📝 Updating attendance status...\n");

    // Get all sessions again to ensure we have the latest data
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal: {
          gte: new Date(2025, 8, 1),
          lte: new Date(2025, 8, 30),
        },
      },
      include: {
        attendances: true,
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    // Define attendance rules
    const attendanceRules = [
      { dates: [1, 2, 3, 4, 5], status: "PRESENT", label: "HADIR" }, // Sept 1-5: Present
    ];

    let updatedCount = 0;

    for (const rule of attendanceRules) {
      for (const day of rule.dates) {
        const session = sessions.find(
          (s) => s.tanggal.getDate() === day && s.tanggal.getMonth() === 8
        );

        if (session) {
          // Update all students' attendance for this date
          const result = await prisma.attendance.updateMany({
            where: {
              attendanceSessionId: session.id,
            },
            data: {
              status: rule.status,
            },
          });

          updatedCount += result.count;
          console.log(
            `  ✓ Sept ${day}: ${result.count} students marked as ${rule.label}`
          );
        } else {
          console.log(`  ⚠️  Sept ${day}: Session not found (might be Sunday/holiday)`);
        }
      }
    }

    console.log(`\n✅ Total attendance records updated: ${updatedCount}`);

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log(`  - Kelas: ${kelas.namaKelas}`);
    console.log(`  - Jumlah Siswa: ${kelas.students.length}`);
    console.log(`  - Jumlah Sesi September: ${sessions.length}`);
    console.log(`  - Total Records Updated: ${updatedCount}`);
    console.log("\n🎉 Attendance seeding completed!\n");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

seedAttendanceSeptember()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
