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

    // ✅ Await params in Next.js 15
    const { id } = await params; // id attendanceSession
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

    // 🔥 Gunakan upsert untuk atomic create/update based on unique constraint
    const updateOrCreatePromises = attendances.map((item) => {
      return prisma.attendance.upsert({
        where: {
          studentId_attendanceSessionId: {
            studentId: item.studentId,
            attendanceSessionId: id,
          },
        },
        update: {
          status: item.status,
          note: item.note, // ✅ Save note
        },
        create: {
          studentId: item.studentId,
          attendanceSessionId: session.id,
          classId: session.classId,
          academicYearId: session.academicYearId,
          status: item.status,
          note: item.note, // ✅ Save note
        },
      });
    });

    await Promise.all(updateOrCreatePromises);

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil disimpan",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan presensi" },
      { status: 500 }
    );
  }
}
