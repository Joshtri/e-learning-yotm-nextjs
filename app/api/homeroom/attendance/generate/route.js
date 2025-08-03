import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { bulan, tahun } = await req.json();
    if (!bulan || !tahun) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        }),
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: { isActive: true },
      },
      include: {
        academicYear: true,
        students: true,
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const liburDates = new Set();

    // 1. HolidayRange
    const holidayRanges = await prisma.holidayRange.findMany({
      where: {
        startDate: { lte: new Date(tahun, bulan, 0) },
        endDate: { gte: new Date(tahun, bulan - 1, 1) },
      },
    });

    for (const libur of holidayRanges) {
      const start = new Date(libur.startDate);
      const end = new Date(libur.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        liburDates.add(new Date(d).toDateString());
      }
    }

    // 2. Holiday (harian)
    const holidays = await prisma.holiday.findMany({
      where: {
        tanggal: {
          gte: new Date(tahun, bulan - 1, 1),
          lte: new Date(tahun, bulan - 1, daysInMonth),
        },
      },
    });

    for (const h of holidays) {
      liburDates.add(new Date(h.tanggal).toDateString());
    }

    const attendances = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const tanggal = new Date(tahun, bulan - 1, day);
      const isSunday = tanggal.getDay() === 0;
      const isHoliday = liburDates.has(tanggal.toDateString());

      if (isSunday || isHoliday) continue;

      const session = await prisma.attendanceSession.create({
        data: {
          tutorId: tutor.id,
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          tanggal,
          keterangan: "Presensi otomatis",
        },
      });

      for (const student of kelas.students) {
        attendances.push({
          studentId: student.id,
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          date: tanggal,
          attendanceSessionId: session.id,
          status: "ABSENT",
        });
      }
    }

    await prisma.attendance.createMany({
      data: attendances,
      skipDuplicates: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Sesi presensi berhasil dibuat dengan memperhitungkan hari libur.",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /homeroom/attendance/generate error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}
