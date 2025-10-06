// app/api/homeroom/my-students-for-promotion/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = await getUserFromCookie();

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
      include: {
        academicYear: true,
        program: true,
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // ✅ Validasi: Hanya bisa akses di semester GENAP
    if (kelas.academicYear.semester !== "GENAP") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Manajemen naik kelas hanya bisa diakses pada semester GENAP",
          currentSemester: kelas.academicYear.semester,
          academicYear: {
            tahunMulai: kelas.academicYear.tahunMulai,
            tahunSelesai: kelas.academicYear.tahunSelesai,
            semester: kelas.academicYear.semester,
          },
        }),
        { status: 403 }
      );
    }

    // ✅ Cari semester GANJIL di tahun ajaran yang sama
    const ganjilAcademicYear = await prisma.academicYear.findFirst({
      where: {
        tahunMulai: kelas.academicYear.tahunMulai,
        tahunSelesai: kelas.academicYear.tahunSelesai,
        semester: "GANJIL",
      },
    });

    // Ambil semua siswa di kelas ini
    const students = await prisma.student.findMany({
      where: { classId: kelas.id },
      include: {
        user: true,
      },
      orderBy: { namaLengkap: "asc" },
    });

    // Ambil FinalScore semester GANJIL dan GENAP
    const finalScoresGanjil = ganjilAcademicYear
      ? await prisma.finalScore.findMany({
          where: {
            tahunAjaranId: ganjilAcademicYear.id,
            studentId: { in: students.map((s) => s.id) },
          },
          include: { subject: true },
        })
      : [];

    const finalScoresGenap = await prisma.finalScore.findMany({
      where: {
        tahunAjaranId: kelas.academicYearId,
        studentId: { in: students.map((s) => s.id) },
      },
      include: { subject: true },
    });

    // Ambil data kehadiran dari KEDUA semester (GANJIL + GENAP)
    const academicYearIds = [kelas.academicYearId];
    if (ganjilAcademicYear) {
      academicYearIds.push(ganjilAcademicYear.id);
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        academicYearId: { in: academicYearIds },
        studentId: { in: students.map((s) => s.id) },
      },
    });

    // Gabungkan FinalScore + Attendance dengan compare semester GANJIL & GENAP
    const result = students.map((student) => {
      // Filter nilai per semester
      const scoresGanjil = finalScoresGanjil.filter(
        (fs) => fs.studentId === student.id
      );
      const scoresGenap = finalScoresGenap.filter(
        (fs) => fs.studentId === student.id
      );

      // Hitung rata-rata nilai per semester
      const avgGanjil =
        scoresGanjil.length > 0
          ? scoresGanjil.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) /
            scoresGanjil.length
          : null;

      const avgGenap =
        scoresGenap.length > 0
          ? scoresGenap.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) /
            scoresGenap.length
          : null;

      // Hitung total nilai gabungan (GANJIL + GENAP)
      const allScores = [...scoresGanjil, ...scoresGenap];
      const avgTotal =
        allScores.length > 0
          ? allScores.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) /
            allScores.length
          : null;

      // Attendance gabungan dari kedua semester
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
        nilaiSemesterGanjil: avgGanjil ? parseFloat(avgGanjil.toFixed(2)) : null,
        nilaiSemesterGenap: avgGenap ? parseFloat(avgGenap.toFixed(2)) : null,
        nilaiTotal: avgTotal ? parseFloat(avgTotal.toFixed(2)) : null,
        detailNilaiGanjil: scoresGanjil.map((fs) => ({
          subject: fs.subject.namaMapel,
          nilai: fs.nilaiAkhir,
        })),
        detailNilaiGenap: scoresGenap.map((fs) => ({
          subject: fs.subject.namaMapel,
          nilai: fs.nilaiAkhir,
        })),
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
            semester: kelas.academicYear.semester,
          },
          className: kelas.namaKelas,
          program: kelas.program?.namaPaket,
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
