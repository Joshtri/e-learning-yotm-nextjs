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

    const { classId } = params;
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

    // Ambil sesi presensi unik berdasarkan classId dan tanggal
    const rawSessions = await prisma.attendanceSession.findMany({
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
      },
      orderBy: {
        tanggal: "asc",
      },
    });

    // 🧠 Dedup berdasarkan tanggal (jika tanggal sama muncul berkali)
    const uniqueSessionsMap = new Map();

    for (const session of rawSessions) {
      const key = new Date(session.tanggal).toISOString().split("T")[0]; // YYYY-MM-DD
      if (!uniqueSessionsMap.has(key)) {
        uniqueSessionsMap.set(key, session);
      }
    }

    const sessions = Array.from(uniqueSessionsMap.values());

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Gagal memuat presensi kelas:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
