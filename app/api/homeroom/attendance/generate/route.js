import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import Holidays from "date-holidays";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoFromYMD(y, mIdx, d) {
  // mIdx: 0..11
  return `${y}-${pad2(mIdx + 1)}-${pad2(d)}`;
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { bulan, tahun } = await req.json(); // bulan 1..12
    if (!bulan || !tahun) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        }),
        { status: 400 }
      );
    }
    if (bulan < 1 || bulan > 12) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parameter bulan tidak valid (1-12)",
        }),
        { status: 400 }
      );
    }

    const monthIdx = bulan - 1; // 0..11
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const monthStart = new Date(tahun, monthIdx, 1);
    const monthEnd = new Date(tahun, monthIdx, daysInMonth);

    // OPTIMIZED: Single query to get tutor + homeroom class + students + check existing sessions
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
      include: {
        homeroomClasses: {
          where: {
            academicYear: { isActive: true },
          },
          include: {
            academicYear: true,
            students: {
              select: { id: true }, // Only need student IDs
            },
            AttendanceSession: {
              where: {
                tanggal: { gte: monthStart, lte: monthEnd },
              },
              select: { id: true }, // Just check if exists
            },
          },
        },
      },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    // Get the homeroom class (should be only one active)
    const kelas = tutor.homeroomClasses[0];
    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Check if already generated
    if (kelas.AttendanceSession.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Presensi bulan ini sudah pernah digenerate.",
        }),
        { status: 400 }
      );
    }

    // === OPTIMIZED: Get all holidays in single queries ===
    const liburISO = new Set();

    // 1) National holidays (cached in memory - no DB query)
    const hd = new Holidays("ID");
    const dh = hd.getHolidays(tahun).filter((h) => !h.substitute);
    const targetMonthPrefix = `${tahun}-${pad2(bulan)}`;

    // Hardcoded fixes for specific holidays that have timezone issues
    const holidayFixes = {
      "2025-09-04": "2025-09-05", // Maulid Nabi Muhammad should be Sept 5, not Sept 4
      "2025-01-27": "2025-01-27", // Keep as is
      "2025-03-30": "2025-03-30", // Idul Fitri day 1
      "2025-03-31": "2025-03-31", // Idul Fitri day 2
      "2025-06-06": "2025-06-06", // Idul Adha
      "2025-06-26": "2025-06-26", // Tahun Baru Islam
    };

    for (const h of dh) {
      // Fix timezone: Convert to Indonesian time (UTC+7)
      const holidayDate = new Date(h.date);
      const indonesianDate = new Date(
        holidayDate.getTime() + 7 * 60 * 60 * 1000
      ); // Add 7 hours for WIB
      let iso = isoFromYMD(
        indonesianDate.getUTCFullYear(),
        indonesianDate.getUTCMonth(),
        indonesianDate.getUTCDate()
      );

      // Apply hardcoded fixes if needed
      if (holidayFixes[iso]) {
        iso = holidayFixes[iso];
      }

      if (iso.startsWith(targetMonthPrefix)) liburISO.add(iso);
    }

    // 2 & 3) Get both holiday ranges and single holidays in parallel
    const [holidayRanges, holidays] = await Promise.all([
      prisma.holidayRange.findMany({
        where: {
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
        select: { startDate: true, endDate: true },
      }),
      prisma.holiday.findMany({
        where: { tanggal: { gte: monthStart, lte: monthEnd } },
        select: { tanggal: true },
      }),
    ]);

    // Process holiday ranges - Fixed timezone handling
    for (const r of holidayRanges) {
      // Ensure we're working with Date objects at start of day in local timezone
      const startDate = new Date(
        r.startDate.getFullYear(),
        r.startDate.getMonth(),
        r.startDate.getDate()
      );
      const endDate = new Date(
        r.endDate.getFullYear(),
        r.endDate.getMonth(),
        r.endDate.getDate()
      );

      const start = new Date(
        Math.max(startDate.getTime(), monthStart.getTime())
      );
      const end = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = isoFromYMD(d.getFullYear(), d.getMonth(), d.getDate());
        liburISO.add(iso);
      }
    }

    // Process single holidays - Fixed timezone handling
    for (const h of holidays) {
      // Ensure consistent date handling
      const holidayDate = new Date(
        h.tanggal.getFullYear(),
        h.tanggal.getMonth(),
        h.tanggal.getDate()
      );
      const iso = isoFromYMD(
        holidayDate.getFullYear(),
        holidayDate.getMonth(),
        holidayDate.getDate()
      );
      liburISO.add(iso);
    }

    // === OPTIMIZED: Batch prepare all data first ===
    const sessionsToCreate = [];
    const workingDays = [];
    let skippedHolidays = 0;
    let skippedSundays = 0;

    // Collect all working days first
    for (let day = 1; day <= daysInMonth; day++) {
      const tanggal = new Date(tahun, monthIdx, day);
      const isSunday = tanggal.getDay() === 0;
      const iso = isoFromYMD(
        tanggal.getFullYear(),
        tanggal.getMonth(),
        tanggal.getDate()
      );
      const isHoliday = liburISO.has(iso);

      if (isSunday) {
        skippedSundays++;
        continue;
      }
      if (isHoliday) {
        skippedHolidays++;
        continue;
      }

      workingDays.push(tanggal);
      sessionsToCreate.push({
        tutorId: tutor.id,
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal,
        keterangan: "Presensi otomatis",
      });
    }

    if (sessionsToCreate.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Tidak ada hari kerja dalam bulan ini.",
          summary: {
            month: `${tahun}-${pad2(bulan)}`,
            sessionsCreated: 0,
            attendancesCreated: 0,
            skipped: { holidays: skippedHolidays, sundays: skippedSundays },
          },
        }),
        { status: 200 }
      );
    }

    // === OPTIMIZED: Use transaction with batch operations ===
    const result = await prisma.$transaction(
      async (tx) => {
        // Create all sessions in one batch
        await tx.attendanceSession.createMany({
          data: sessionsToCreate,
          skipDuplicates: true,
        });

        // Get the created session IDs (need to query back since createMany doesn't return IDs)
        const createdSessions = await tx.attendanceSession.findMany({
          where: {
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
            tanggal: { in: workingDays },
          },
          select: { id: true, tanggal: true },
          orderBy: { tanggal: "asc" },
        });

        // Prepare all attendance records in batches
        const batchSize = 1000; // Adjust based on your DB limits
        const allAttendances = [];

        for (const session of createdSessions) {
          for (const student of kelas.students) {
            allAttendances.push({
              studentId: student.id,
              classId: kelas.id,
              academicYearId: kelas.academicYearId,
              date: session.tanggal,
              attendanceSessionId: session.id,
              status: "ABSENT",
            });
          }
        }

        // Create attendance records in batches
        for (let i = 0; i < allAttendances.length; i += batchSize) {
          const batch = allAttendances.slice(i, i + batchSize);
          await tx.attendance.createMany({
            data: batch,
            skipDuplicates: true,
          });
        }

        return {
          sessionsCreated: createdSessions.length,
          attendancesCreated: allAttendances.length,
        };
      },
      {
        timeout: 30000, // 30 second timeout for transaction
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Sesi presensi berhasil dibuat dengan memperhitungkan hari libur.",
        summary: {
          month: `${tahun}-${pad2(bulan)}`,
          sessionsCreated: result.sessionsCreated,
          attendancesCreated: result.attendancesCreated,
          skipped: { holidays: skippedHolidays, sundays: skippedSundays },
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    // Remove console.error for production
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error?.message,
      }),
      { status: 500 }
    );
  }
}
