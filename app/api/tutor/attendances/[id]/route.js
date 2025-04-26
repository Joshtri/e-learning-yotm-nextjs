import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Verifikasi user
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Dapatkan data attendance session beserta relasinya
    const attendanceSession = await prisma.attendanceSession.findUnique({
      where: {
        id,
        tutorId: user.id, // Pastikan hanya tutor pemilik yang bisa akses
      },
      include: {
        tutor: {
          select: {
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: {
              select: {
                namaPaket: true,
              },
            },
          },
        },
        academicYear: {
          select: {
            tahunMulai: true,
            tahunSelesai: true,
          },
        },
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                namaLengkap: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            student: {
              namaLengkap: "asc",
            },
          },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        { success: false, message: "Sesi presensi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Format response
    const responseData = {
      id: attendanceSession.id,
      tanggal: attendanceSession.tanggal,
      keterangan: attendanceSession.keterangan,
      tutor: {
        id: user.id,
        nama: attendanceSession.tutor.user.nama,
      },
      kelas: {
        id: attendanceSession.class.id,
        namaKelas: attendanceSession.class.namaKelas,
        program: attendanceSession.class.program.namaPaket,
      },
      tahunAjaran: `${attendanceSession.academicYear.tahunMulai}/${attendanceSession.academicYear.tahunSelesai}`,
      daftarHadir: attendanceSession.attendances.map((attendance) => ({
        id: attendance.id,
        studentId: attendance.student.id,
        namaLengkap: attendance.student.namaLengkap,
        email: attendance.student.user.email,
        status: attendance.status,
        tanggal: attendance.date,
      })),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching attendance session:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data sesi presensi" },
      { status: 500 }
    );
  }
}
// DELETE Attendance Session
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: params.id },
    });

    if (!session || session.tutorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    await prisma.attendanceSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Presensi dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus presensi" },
      { status: 500 }
    );
  }
}

// Tambahan PATCH untuk Update Attendance Session
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const session = await prisma.attendanceSession.findUnique({
      where: { id: params.id },
    });

    if (!session || session.tutorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: params.id },
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : undefined,
        keterangan: body.keterangan,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal update presensi" },
      { status: 500 }
    );
  }
}
