import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
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

    const { status } = await request.json();
    if (!["PRESENT", "SICK", "EXCUSED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status presensi tidak valid" },
        { status: 400 }
      );
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: params.attendanceSessionId },
      select: { id: true, academicYearId: true, tanggal: true, classId: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi presensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi: hanya hari yang sama
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDate = new Date(session.tanggal);
    sessionDate.setHours(0, 0, 0, 0);
    if (today.getTime() !== sessionDate.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: `Presensi hanya pada ${sessionDate.toLocaleDateString(
            "id-ID"
          )}`,
        },
        { status: 400 }
      );
    }

    // Cek existing
    const existing = await prisma.attendance.findFirst({
      where: { studentId: student.id, attendanceSessionId: session.id },
      select: { id: true, status: true },
    });

    if (existing) {
      // ✅ Izinkan update sekali dari ABSENT → final status
      if (existing.status === "ABSENT") {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { status },
        });
        return NextResponse.json({
          success: true,
          message: "Presensi diperbarui",
        });
      }
      // Jika sudah final, tolak
      return NextResponse.json(
        {
          success: false,
          message: `Anda sudah mengisi presensi sebagai "${existing.status}"`,
        },
        { status: 400 }
      );
    }

    // Jika belum ada record sama sekali, buat baru
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: student.classId,
        academicYearId: session.academicYearId,
        attendanceSessionId: session.id,
        status,
        date: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Presensi berhasil" });
  } catch (error) {
    console.error("POST /student/attendance/:id error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal submit presensi" },
      { status: 500 }
    );
  }
}
