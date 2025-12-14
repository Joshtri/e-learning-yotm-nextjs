import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    // ✅ Await params in Next.js 15
    const { id } = await params;

    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // First, get tutor info
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get attendance session
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        tutor: { select: { user: { select: { nama: true } } } },
        subject: {
          select: {
            id: true,
            namaMapel: true,
          },
        },
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: { select: { namaPaket: true } },
            students: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                namaLengkap: true,
                user: { select: { email: true } },
              },
            },
            // Check if current tutor teaches in this class
            classSubjectTutors: {
              where: { tutorId: tutor.id },
              select: { id: true },
            },
            // Check if current tutor is homeroom teacher
            homeroomTeacher: {
              select: { id: true },
            },
          },
        },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
        attendances: {
          select: {
            id: true,
            studentId: true,
            status: true,
          },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if tutor has access to this attendance session
    const isSessionOwner = attendanceSession.tutorId === tutor.id;
    const isTeachingInClass = attendanceSession.class.classSubjectTutors.length > 0;
    const isHomeroomTeacher = attendanceSession.class.homeroomTeacher?.id === tutor.id;

    if (!isSessionOwner && !isTeachingInClass && !isHomeroomTeacher) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke sesi ini" },
        { status: 403 }
      );
    }

    // ✅ Get attendance history for the same day (for context)
    const sessionDate = new Date(attendanceSession.tanggal);
    const startOfDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const otherSessionsToday = await prisma.attendanceSession.findMany({
      where: {
        classId: attendanceSession.classId,
        tanggal: {
          gte: startOfDay,
          lt: endOfDay,
        },
        id: { not: id }, // Exclude current session
      },
      include: {
        subject: { select: { namaMapel: true } },
        tutor: { select: { user: { select: { nama: true } } } },
        attendances: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
      orderBy: { tanggal: "asc" },
    });

    // 🔥 Gabungkan siswa + data attendance existing + history dari sesi lain di hari yang sama
    const daftarHadir = attendanceSession.class.students.map((student) => {
      const existingAttendance = attendanceSession.attendances.find(
        (att) => att.studentId === student.id
      );

      // Get attendance history from other sessions today
      const attendanceHistory = otherSessionsToday.map(session => {
        const studentAttendance = session.attendances.find(att => att.studentId === student.id);
        return {
          subjectName: session.subject?.namaMapel || "Homeroom",
          tutorName: session.tutor.user.nama,
          status: studentAttendance?.status || null,
        };
      }).filter(h => h.status !== null); // Only include sessions where student has attendance

      return {
        id: existingAttendance?.id ?? null, // bisa null kalau belum ada
        studentId: student.id,
        namaLengkap: student.namaLengkap,
        email: student.user.email,
        status: existingAttendance?.status ?? null,

        attendanceHistory, // ✅ History attendance di hari yang sama
      };
    });

    const responseData = {
      id: attendanceSession.id,
      tanggal: attendanceSession.tanggal,
      keterangan: attendanceSession.keterangan,
      tutor: {
        id: user.id,
        nama: attendanceSession.tutor.user.nama,
      },
      subject: attendanceSession.subject, // ✅ Restored Subject
      kelas: {
        id: attendanceSession.class.id,
        namaKelas: attendanceSession.class.namaKelas,
        program: attendanceSession.class.program.namaPaket,
      },
      tahunAjaran: `${attendanceSession.academicYear.tahunMulai}/${attendanceSession.academicYear.tahunSelesai}`,
      daftarHadir,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error fetching attendance session:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data sesi presensi" },
      { status: 500 }
    );
  }
}

// Tambahan PATCH untuk Update Attendance Session
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (session.tutorId !== tutor.id) {
      return NextResponse.json(
        { success: false, message: "Anda tidak berhak mengubah sesi ini" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "DIMULAI" && !session.startTime) {
        updateData.startTime = new Date();
      }
      if (body.status === "SELESAI" && !session.endTime) {
        updateData.endTime = new Date();
      }
    }

    if (body.keterangan !== undefined) {
      updateData.keterangan = body.keterangan;
    }

    const updated = await prisma.attendanceSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal update presensi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal update presensi" },
      { status: 500 }
    );
  }
}
