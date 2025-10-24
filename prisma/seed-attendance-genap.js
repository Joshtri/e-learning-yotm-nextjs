import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Helper function to check if date is Sunday
function isSunday(date) {
  return date.getDay() === 0; // 0 = Sunday
}

// Helper function to generate dates range
function getDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Skip Sundays (hari Minggu)
    if (!isSunday(currentDate)) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function createAttendanceForGenap() {
  console.log("🌱 Creating Attendance for Semester GENAP 2025/2026 - Kelas 11...\n");

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
      homeroomTeacher: true,
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

  if (!kelas11Genap.homeroomTeacher) {
    console.log("❌ No homeroom teacher found for Kelas 11 GENAP");
    return;
  }

  // ⚠️ SESUAI PERMINTAAN: 1-24 Oktober 2025
  // Note: Oktober 2025 sebenarnya semester GANJIL, bukan GENAP
  // Tapi tetap bisa dipakai untuk testing atau kebutuhan khusus

  const startDate = new Date("2025-10-01"); // 1 Oktober 2025
  const endDate = new Date("2025-10-24");   // 24 Oktober 2025

  // Generate all dates (skip Sunday)
  const attendanceDates = getDateRange(startDate, endDate);

  console.log(`📅 Generating attendance for ${attendanceDates.length} days (excluding Sundays)\n`);
  console.log(`Period: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}\n`);

  let sessionCount = 0;
  let attendanceCount = 0;

  for (const date of attendanceDates) {
    // Buat AttendanceSession untuk hari ini
    const session = await prisma.attendanceSession.create({
      data: {
        tanggal: date,
        keterangan: `Pertemuan ${sessionCount + 1} - ${date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        tutor: {
          connect: { id: kelas11Genap.homeroomTeacher.id },
        },
        class: {
          connect: { id: kelas11Genap.id },
        },
        academicYear: {
          connect: { id: kelas11Genap.academicYearId },
        },
      },
    });

    sessionCount++;

    // Tandai semua siswa HADIR untuk session ini
    const attendanceRecords = [];

    for (const student of kelas11Genap.students) {
      attendanceRecords.push({
        studentId: student.id,
        classId: kelas11Genap.id,
        academicYearId: kelas11Genap.academicYearId,
        date: date,
        status: "PRESENT",
        attendanceSessionId: session.id,
      });
      attendanceCount++;
    }

    // Bulk insert attendance records
    await prisma.attendance.createMany({
      data: attendanceRecords,
    });

    console.log(`  ✓ Created session for ${date.toLocaleDateString('id-ID')} - ${kelas11Genap.students.length} students marked HADIR`);
  }

  console.log(`\n✅ Created ${sessionCount} attendance sessions with ${attendanceCount} attendance records\n`);
}

async function main() {
  try {
    await createAttendanceForGenap();
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
    console.log("✅ Attendance seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
