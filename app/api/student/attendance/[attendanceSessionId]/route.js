import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const { attendanceSessionId } = await params;
    console.log("DEBUG: POST /api/student/attendance/[id] hit");
    console.log("DEBUG: attendanceSessionId from params:", attendanceSessionId);

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

    const { status, note, attachment } = await request.json();

    // Status validation
    if (!["PRESENT", "SICK", "EXCUSED", "ABSENT"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status presensi tidak valid" },
        { status: 400 }
      );
    }

    // Additional Validation
    if (status !== "PRESENT") {
      if (!note || note.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: `Alasan wajib diisi untuk status ${status}` },
          { status: 400 }
        );
      }
    }

    if (status === "SICK") {
      if (!attachment) {
        return NextResponse.json(
          { success: false, message: "Surat sakit wajib diunggah" },
          { status: 400 }
        );
      }
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: attendanceSessionId },
      select: { id: true, academicYearId: true, tanggal: true, classId: true },
    });
    console.log("DEBUG: Session found:", session);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi presensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi: hanya hari yang sama (timezone-aware)
    const now = new Date();
    const sessionDate = new Date(session.tanggal);

    // Normalize ke midnight waktu lokal untuk perbandingan
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionMidnight = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    if (todayMidnight.getTime() !== sessionMidnight.getTime()) {
      return NextResponse.json(
        {
          success: false,
          message: `Presensi hanya dapat dilakukan pada tanggal ${sessionDate.toLocaleDateString("id-ID")}`,
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
      // ✅ Izinkan update sekali dari ABSENT → final status OR if it was just created (maybe default ABSENT?)
      // User policy: If student can mark themselves, they update it.
      // Usually if existing, we might block unless it was default ABSENT.
      if (existing.status === "ABSENT" || existing.status === "PRESENT") { // Allow correction? Or strict? Sticking to strict or only ABSENT as per previous logic
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status,
            note: note || null,
            attachment: attachment || null
          },
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
        note: note || null,
        attachment: attachment || null
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
