// app/api/student/attendance/sessions/route.js

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

    if (!student || !student.classId) {
      return NextResponse.json(
        { success: false, message: "Data siswa tidak valid" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset jam ke 00:00

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        classId: student.classId,
        // tanggal: today,
      },
      include: {
        class: { select: { namaKelas: true } },
      },
      orderBy: { tanggal: "asc" },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Gagal fetch sesi presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat sesi presensi" },
      { status: 500 }
    );
  }
}
