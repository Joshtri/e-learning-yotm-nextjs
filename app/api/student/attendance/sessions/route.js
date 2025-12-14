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

    // Ambil semua sesi untuk tahun ajaran aktif (bukan hanya bulan ini)
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId: student.classId,
        academicYearId: activeYear.id,
      },
      include: {
        subject: {
          select: { namaMapel: true },
        },
        tutor: {
          select: {
            user: { select: { nama: true } },
          },
        },
      },
      orderBy: [
        { subjectId: "asc" }, // Group by subject implicitly
        { meetingNumber: "asc" }, // Order by meeting number 1..16
      ],
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
          meetingNumber: session.meetingNumber,
          tanggal: session.tanggal,
          startTime: session.startTime,
          endTime: session.endTime,
          keterangan: session.keterangan,
          status: session.status, // e.g. DIMULAI, SELESAI
          subjectName: session.subject?.namaMapel || "Wali Kelas",
          tutorName: session.tutor?.user?.nama || "-",
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
