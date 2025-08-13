import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true, classId: true },
    });

    if (!student?.classId) {
      return NextResponse.json(
        { success: false, message: "Data siswa tidak valid" },
        { status: 400 }
      );
    }

    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    if (!activeYear) {
      return NextResponse.json(
        { success: false, message: "Tahun ajaran aktif tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil semua sesi bulan ini
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId: student.classId,
        academicYearId: activeYear.id,
        tanggal: { gte: start, lte: end },
      },
      orderBy: { tanggal: "asc" },
    });

    const data = await Promise.all(
      sessions.map(async (session) => {
        const attendance = await prisma.attendance.findFirst({
          where: {
            attendanceSessionId: session.id,
            studentId: student.id,
          },
        });

        return {
          id: session.id,
          tanggal: session.tanggal,
          keterangan: session.keterangan,
          attendanceStatus: attendance?.status || null,
        };
      })
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /student/attendance/sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat sesi presensi" },
      { status: 500 }
    );
  }
}
