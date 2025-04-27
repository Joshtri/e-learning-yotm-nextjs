import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const attendanceSession = await prisma.attendanceSession.findFirst({
      where: {
        id: id,
        tutor: { userId: user.id },
      },
      include: {
        tutor: { select: { user: { select: { nama: true } } } },
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: { select: { namaPaket: true } },
            students: {
              // 🔥 Tambahkan ambil semua siswa aktif di kelas
              where: { status: "ACTIVE" },
              select: {
                id: true,
                namaLengkap: true,
                user: { select: { email: true } },
              },
            },
          },
        },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
        attendances: {
          // yang sudah ada presensinya
          select: {
            id: true,
            studentId: true,
            status: true,
            date: true,
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

    // 🔥 Gabungkan siswa + data attendance existing
    const daftarHadir = attendanceSession.class.students.map((student) => {
      const existingAttendance = attendanceSession.attendances.find(
        (att) => att.studentId === student.id
      );

      return {
        id: existingAttendance?.id ?? null, // bisa null kalau belum ada
        studentId: student.id,
        namaLengkap: student.namaLengkap,
        email: student.user.email,
        status: existingAttendance?.status ?? null,
        tanggal: existingAttendance?.date ?? null,
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
// export async function PATCH(request, { params }) {
//   try {
//     const user = await getUserFromCookie();
//     if (!user || user.role !== "TUTOR") {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();

//     const session = await prisma.attendanceSession.findUnique({
//       where: { id: params.id },
//     });

//     if (!session || session.tutorId !== user.id) {
//       return NextResponse.json(
//         { success: false, message: "Not found" },
//         { status: 404 }
//       );
//     }

//     const updated = await prisma.attendanceSession.update({
//       where: { id: params.id },
//       data: {
//         tanggal: body.tanggal ? new Date(body.tanggal) : undefined,
//         keterangan: body.keterangan,
//       },
//     });

//     return NextResponse.json({ success: true, data: updated });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { success: false, message: "Gagal update presensi" },
//       { status: 500 }
//     );
//   }
// }
