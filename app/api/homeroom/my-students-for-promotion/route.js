// app/api/homeroom/my-students-for-promotion/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = getUserFromCookie();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Cari tutor berdasarkan user login
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    // Cari kelas di mana tutor jadi wali
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: { isActive: true }, // ✅ hanya tahun ajaran aktif
      },
      include: { academicYear: true }, // <-- ini wajib
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Ambil semua siswa di kelas ini
    const students = await prisma.student.findMany({
      where: { classId: kelas.id },
      include: {
        user: true,
        FinalScore: {
          where: { tahunAjaranId: kelas.academicYearId },
          include: { subject: true },
        },
      },
      orderBy: { namaLengkap: "asc" },
    });

    // Ambil data kehadiran siswa
    const attendances = await prisma.attendance.findMany({
      where: {
        academicYearId: kelas.academicYearId,
        studentId: { in: students.map((s) => s.id) },
      },
    });

    

    // Gabungkan FinalScore + Attendance
    const result = students.map((student) => {
      const studentAttendance = attendances.filter(
        (a) => a.studentId === student.id
      );

      const countByStatus = {
        PRESENT: 0,
        SICK: 0,
        EXCUSED: 0,
        ABSENT: 0,
      };

      studentAttendance.forEach((a) => {
        if (a.status in countByStatus) countByStatus[a.status]++;
      });

      const totalHadir = studentAttendance.length;
      const persenKehadiran = totalHadir
        ? ((countByStatus.PRESENT / totalHadir) * 100).toFixed(1)
        : "0.0";

      return {
        ...student,
        attendanceSummary: {
          hadir: countByStatus.PRESENT,
          sakit: countByStatus.SICK,
          izin: countByStatus.EXCUSED,
          alpa: countByStatus.ABSENT,
          persen: Number(persenKehadiran),
        },
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          academicYear: {
            tahunMulai: kelas.academicYear.tahunMulai,
            tahunSelesai: kelas.academicYear.tahunSelesai,
          },
          className: kelas.namaKelas, // ⬅️ Tambahan
          students: result,
        },
      }),
      { status: 200 } 
    );
    
    
  } catch (error) {
    console.error("Error fetching homeroom students:", error);
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
