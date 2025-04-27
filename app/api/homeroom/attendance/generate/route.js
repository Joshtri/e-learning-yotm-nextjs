// import prisma from "@/lib/prisma";
// import { getUserFromCookie } from "@/utils/auth";

// export async function POST(req) {
//   try {
//     const user = getUserFromCookie();
//     if (!user) {
//       return new Response(
//         JSON.stringify({ success: false, message: "Unauthorized" }),
//         { status: 401 }
//       );
//     }

//     const { bulan, tahun } = await req.json();
//     if (!bulan || !tahun) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           message: "Bulan dan Tahun wajib diisi",
//         }),
//         { status: 400 }
//       );
//     }

//     const tutor = await prisma.tutor.findUnique({
//       where: { userId: user.id },
//     });

//     if (!tutor) {
//       return new Response(
//         JSON.stringify({ success: false, message: "Tutor not found" }),
//         { status: 404 }
//       );
//     }

//     const kelas = await prisma.class.findFirst({
//       where: { homeroomTeacherId: tutor.id },
//       include: {
//         students: { where: { status: "ACTIVE" } },
//         academicYear: true,
//       },
//     });

//     if (!kelas) {
//       return new Response(
//         JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
//         { status: 404 }
//       );
//     }

//     const { students } = kelas;
//     const daysInMonth = new Date(tahun, bulan, 0).getDate(); // jumlah hari di bulan

//     const bulkAttendance = [];

//     for (let day = 1; day <= daysInMonth; day++) {
//       const tanggal = new Date(tahun, bulan - 1, day);

//       // Step 1: Buat AttendanceSession untuk hari ini
//       const session = await prisma.attendanceSession.create({
//         data: {
//           tutorId: tutor.id,
//           classId: kelas.id,
//           academicYearId: kelas.academicYearId,
//           tanggal: tanggal,
//           keterangan: "Presensi otomatis",
//         },
//       });

//       // Step 2: Buat Attendance untuk semua siswa
//       for (const student of students) {
//         bulkAttendance.push({
//           studentId: student.id,
//           classId: kelas.id,
//           academicYearId: kelas.academicYearId,
//           date: tanggal,
//           status: "ABSENT", // default alpa
//           attendanceSessionId: session.id, // ini diisi!
//         });
//       }
//     }

//     await prisma.attendance.createMany({
//       data: bulkAttendance,
//       skipDuplicates: true,
//     });

//     return new Response(
//       JSON.stringify({ success: true, message: "Presensi berhasil dibuat" }),
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error(error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         message: "Internal Server Error",
//         error: error.message,
//       }),
//       { status: 500 }
//     );
//   }
// }

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { bulan, tahun } = await req.json();
    if (!bulan || !tahun) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        }),
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    const kelas = await prisma.class.findFirst({
      where: { homeroomTeacherId: tutor.id },
      include: {
        academicYear: true,
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const daysInMonth = new Date(tahun, bulan, 0).getDate(); // jumlah hari di bulan

    const sessions = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const tanggal = new Date(tahun, bulan - 1, day);

      sessions.push({
        tutorId: tutor.id,
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
        tanggal: tanggal,
        keterangan: "Presensi otomatis",
      });
    }

    await prisma.attendanceSession.createMany({
      data: sessions,
      skipDuplicates: true, // supaya kalau sudah pernah dibuat, tidak error
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sesi presensi berhasil dibuat",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
