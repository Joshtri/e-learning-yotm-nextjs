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
                  gte: new Date(tahun, bulan - 1, 1),
                  lte: new Date(tahun, bulan, 0), // Correctly get the last day of the month
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
    const endDate = new Date(tahun, bulan, 0); // hari terakhir bulan tsb

    // Hapus attendance lewat filter di AttendanceSession.tanggal
    const deletedAttendances = await prisma.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        AttendanceSession: { // relasi sesuai schema (huruf besar)
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
          classId: kelas.id,
        },
      },
    });

    // Hapus session presensi juga
    const deletedSessions = await prisma.attendanceSession.deleteMany({
      where: {
        classId: kelas.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

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
