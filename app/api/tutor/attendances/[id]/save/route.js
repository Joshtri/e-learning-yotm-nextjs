import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params; // id attendanceSession
    const body = await request.json();
    const { attendances } = body;

    if (!attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { success: false, message: "Data attendances tidak valid" },
        { status: 400 }
      );
    }

    // 🔥 Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    // 🔥 Cari session
    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            classSubjectTutors: {
              where: { tutorId: tutor.id },
              select: { id: true },
            },
            homeroomTeacher: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi presensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if tutor has access to save attendance for this session
    const isSessionOwner = session.tutorId === tutor.id;
    const isTeachingInClass = session.class.classSubjectTutors.length > 0;
    const isHomeroomTeacher = session.class.homeroomTeacher?.id === tutor.id;

    if (!isSessionOwner && !isTeachingInClass && !isHomeroomTeacher) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses untuk menyimpan presensi ini" },
        { status: 403 }
      );
    }

    // 🔥 Untuk setiap student, cek apakah attendancenya sudah ada
    const updateOrCreatePromises = attendances.map(async (item) => {
      const existing = await prisma.attendance.findFirst({
        where: {
          attendanceSessionId: id,
          studentId: item.studentId,
        },
      });

      if (existing) {
        // Kalau sudah ada, update
        return prisma.attendance.update({
          where: {
            id: existing.id,
          },
          data: {
            status: item.status,
          },
        });
      } else {
        // Kalau belum ada, create baru
        return prisma.attendance.create({
          data: {
            studentId: item.studentId,
            classId: session.classId,
            academicYearId: session.academicYearId,
            date: session.tanggal,
            status: item.status,
            attendanceSessionId: session.id,
          },
        });
      }
    });

    await Promise.all(updateOrCreatePromises);

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil disimpan",
    });
  } catch (error) {
    console.error("Gagal menyimpan presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan presensi" },
      { status: 500 }
    );
  }
}
