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

    // Cari wali kelas (homeroom) aktif
    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    const kelas = await prisma.class.findFirst({
      where: { homeroomTeacherId: tutor.id, academicYear: { isActive: true } },
      include: { academicYear: true, students: true },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const monthIdx = bulan - 1; // 0..11
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const monthStart = new Date(tahun, monthIdx, 1);
    const monthEnd = new Date(tahun, monthIdx, daysInMonth);

    // TOLAK kalau sudah pernah generate untuk bulan tsb
    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal: { gte: monthStart, lte: monthEnd },
      },
    });
    if (existingSession) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Presensi bulan ini sudah pernah digenerate.",
        }),
        { status: 400 }
      );
    }

    // === KUMPULKAN TANGGAL LIBUR DARI 3 SUMBER ===
    const liburISO = new Set();

    // 1) Libur nasional: date-holidays (Indonesia)
    const hd = new Holidays("ID");
    const dh = hd.getHolidays(tahun).filter((h) => !h.substitute); // buang pengganti
    const targetMonthPrefix = `${tahun}-${pad2(bulan)}`; // "YYYY-MM"
    for (const h of dh) {
      const iso = (h.date || "").slice(0, 10); // "YYYY-MM-DD"
      if (iso.startsWith(targetMonthPrefix)) liburISO.add(iso);
    }

    // 2) HolidayRange (rentang) dari DB → expand per hari
    const holidayRanges = await prisma.holidayRange.findMany({
      where: {
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
      },
      select: { startDate: true, endDate: true, nama: true },
    });

    for (const r of holidayRanges) {
      const start = new Date(
        Math.max(r.startDate.getTime(), monthStart.getTime())
      );
      const end = new Date(Math.min(r.endDate.getTime(), monthEnd.getTime()));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = isoFromYMD(d.getFullYear(), d.getMonth(), d.getDate());
        liburISO.add(iso);
      }
    }

    // 3) Holiday (harian) dari DB
    const holidays = await prisma.holiday.findMany({
      where: { tanggal: { gte: monthStart, lte: monthEnd } },
      select: { tanggal: true },
    });
    for (const h of holidays) {
      const d = h.tanggal;
      const iso = isoFromYMD(d.getFullYear(), d.getMonth(), d.getDate());
      liburISO.add(iso);
    }

    // === GENERATE SESSIONS & ATTENDANCE (skip Minggu dan hari libur) ===
    let createdSessions = 0;
    let skippedHolidays = 0;
    let skippedSundays = 0;

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

      const session = await prisma.attendanceSession.create({
        data: {
          tutorId: tutor.id,
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          tanggal,
          keterangan: "Presensi otomatis",
        },
      });
      createdSessions++;

      // siapkan attendance siswa default ABSENT
      const attendances = kelas.students.map((s) => ({
        studentId: s.id,
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        date: tanggal,
        attendanceSessionId: session.id,
        status: "ABSENT",
      }));

      if (attendances.length) {
        await prisma.attendance.createMany({
          data: attendances,
          skipDuplicates: true,
        });
      }
    }

    const createdAttendances = createdSessions * (kelas.students?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Sesi presensi berhasil dibuat dengan memperhitungkan hari libur.",
        summary: {
          month: `${tahun}-${pad2(bulan)}`,
          sessionsCreated: createdSessions,
          attendancesCreated: createdAttendances,
          skipped: { holidays: skippedHolidays, sundays: skippedSundays },
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /homeroom/attendance/generate error:", error);
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
