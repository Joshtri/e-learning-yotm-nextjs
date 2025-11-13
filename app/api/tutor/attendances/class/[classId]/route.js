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

    // Ambil sesi presensi berdasarkan classId
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId,
      },
      include: {
        academicYear: {
          select: {
            tahunMulai: true,
            tahunSelesai: true,
          },
        },
        // ✅ Removed subject relation - subjectId tidak ada di AttendanceSession anymore
        tutor: { // ✅ Include tutor info untuk identifikasi siapa yang buat
          select: {
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
      orderBy: [
        { tanggal: "desc" }, // Terbaru dulu
        { createdAt: "desc" }, // Jika sama tanggalnya, yang baru dibuat dulu
      ],
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Gagal memuat presensi kelas:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
