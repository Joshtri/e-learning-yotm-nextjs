import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(_, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Await params in Next.js 15
    const { classId } = await params;
    if (!classId) {
      return NextResponse.json(
        { success: false, message: "classId diperlukan" },
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // 1. Get Total Active Students in Class
    const totalStudents = await prisma.student.count({
      where: {
        classId,
        status: "ACTIVE",
      },
    });

    // Ambil sesi presensi berdasarkan classId dan tutorId (Hanya sesi milik tutor ini)
    const rawSessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
        tutorId: tutor.id, // 🔥 Filter by Logged-in Tutor
      },
      include: {
        academicYear: {
          select: {
            tahunMulai: true,
            tahunSelesai: true,
            semester: true,
          },
        },
        subject: {
          select: {
            id: true,
            namaMapel: true,
            kodeMapel: true,
          },
        },
        tutor: { // ✅ Include tutor info untuk identifikasi siapa yang buat
          select: {
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
        attendances: {
          select: {
            status: true,
          },
        },
      },
      orderBy: [
        { tanggal: "desc" }, // Terbaru dulu
        { createdAt: "desc" }, // Jika sama tanggalnya, yang baru dibuat dulu
      ],
    });

    const sessions = rawSessions.map((session) => {
      const presentCount = session.attendances.filter(
        (a) => a.status === "PRESENT"
      ).length;
      return {
        ...session,
        attendanceSummary: `${presentCount}/${totalStudents}`,
      };
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
