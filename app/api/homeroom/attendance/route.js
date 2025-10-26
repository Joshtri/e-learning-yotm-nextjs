import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan"));
    const tahun = parseInt(searchParams.get("tahun"));

    if (!bulan || !tahun) {
      return NextResponse.json(
        {
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        },
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    const getStartDate = new Date(tahun, bulan - 1, 1);
    const getEndDate = new Date(tahun, bulan, 0);

    console.log("DEBUG GET - bulan:", bulan, "tahun:", tahun);
    console.log("DEBUG GET - startDate:", getStartDate);
    console.log("DEBUG GET - endDate:", getEndDate);

    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
      include: {
        students: {
          where: { status: "ACTIVE" },
          include: {
            Attendance: {
              where: {
                date: {
                  gte: getStartDate,
                  lte: getEndDate,
                },
                // ✅ FILTER: Hanya tampilkan attendance dari homeroom session (subjectId = NULL)
                AttendanceSession: {
                  subjectId: null,
                },
              },
              include: {
                academicYear: true,
              },
            },
          },
        },
        academicYear: true, // Include academicYear for the class itself
      },
    });

    if (kelas) {
      const totalAttendances = kelas.students.reduce((sum, student) => sum + student.Attendance.length, 0);
      console.log("DEBUG GET - Total attendances found:", totalAttendances);
    }

    if (!kelas) {
      // If no class is assigned to the homeroom teacher at all, return empty.
      return NextResponse.json({ success: true, data: [] });
    }

    // Pass academic year info along with the students
    const responseData = {
        students: kelas.students,
        academicYearInfo: kelas.academicYear
    }

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan") || "");
    const tahun = parseInt(searchParams.get("tahun") || "");

    if (!bulan || !tahun) {
      return NextResponse.json(
        {
          success: false,
          message: "Bulan dan Tahun harus diisi",
        },
        { status: 400 }
      );
    }

    // Cari tutor dari user
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        {
          success: false,
          message: "Homeroom Teacher tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Cari kelas terbaru yang dipegang wali kelas
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
      include: { students: true },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const studentIds = kelas.students.map((s) => s.id);
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999); // hari terakhir bulan + waktu

    console.log("DEBUG Delete - classId:", kelas.id);
    console.log("DEBUG Delete - studentIds:", studentIds);
    console.log("DEBUG Delete - startDate:", startDate);
    console.log("DEBUG Delete - endDate:", endDate);

    // Langkah 1: Cek data attendance yang ada
    const existingAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        classId: kelas.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Found attendances:", existingAttendances.length);

    // Langkah 2: Cek session yang ada
    const existingSessions = await prisma.attendanceSession.findMany({
      where: {
        classId: kelas.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Found sessions:", existingSessions.length);
    console.log("DEBUG - Sessions detail:", existingSessions);

    // Langkah 3: Hapus attendance terlebih dahulu (karena foreign key)
    const deletedAttendances = await prisma.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        classId: kelas.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Deleted attendances count:", deletedAttendances.count);

    // Langkah 4: Hapus session presensi
    const deletedSessions = await prisma.attendanceSession.deleteMany({
      where: {
        classId: kelas.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Deleted sessions count:", deletedSessions.count);

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedAttendances.count} presensi dan ${deletedSessions.count} sesi di bulan ${bulan}/${tahun}`,
    });

  } catch (error) {
    console.error("DELETE /homeroom/attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
