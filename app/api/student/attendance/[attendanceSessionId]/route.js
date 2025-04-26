// app/api/student/attendance/[attendanceSessionId]/route.js
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

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const { status } = await request.json();

    if (!["PRESENT", "SICK", "EXCUSED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status tidak valid" },
        { status: 400 }
      );
    }

    // Pastikan sesi presensi ada
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id: params.attendanceSessionId },
      select: { academicYearId: true, tanggal: true },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { success: false, message: "Sesi presensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // ✅ Tambahkan validasi tanggal
    const today = new Date();
    const sessionDate = new Date(attendanceSession.tanggal);

    const isSameDate =
      today.getFullYear() === sessionDate.getFullYear() &&
      today.getMonth() === sessionDate.getMonth() &&
      today.getDate() === sessionDate.getDate();

    if (!isSameDate) {
      return NextResponse.json(
        {
          success: false,
          message: `Presensi hanya dapat dilakukan pada tanggal ${sessionDate.toLocaleDateString(
            "id-ID"
          )}`,
        },
        { status: 400 }
      );
    }

    // Cek apakah sudah pernah absen
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        attendanceSessionId: params.attendanceSessionId,
      },
      select: {
        status: true,
        date: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Anda sudah mengisi presensi sebagai "${
            existing.status
          }" pada ${new Date(existing.date).toLocaleDateString("id-ID")}`,
        },
        { status: 400 }
      );
    }

    // ✅ Fix: Tambah presensi
    await prisma.attendance.create({
      data: {
        student: { connect: { id: student.id } },
        class: { connect: { id: student.classId } },
        academicYear: { connect: { id: attendanceSession.academicYearId } },
        AttendanceSession: { connect: { id: params.attendanceSessionId } },
        status,
        date: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Presensi berhasil" });
  } catch (error) {
    console.error("Gagal submit presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal submit presensi" },
      { status: 500 }
    );
  }
}
