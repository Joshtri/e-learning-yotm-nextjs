import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // 🔥 Cari kelas yang dipegang sebagai wali kelas
    // Prioritas: tahun akademik terbaru, yang punya siswa aktif
    const allClasses = await prisma.class.findMany({
      where: {
        homeroomTeacherId: tutor.id,
      },
      include: {
        students: {
          where: { status: "ACTIVE" },
        },
        academicYear: true,
        program: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } }, // GENAP dulu, baru GANJIL
      ],
    });

    if (!allClasses || allClasses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Kelas tidak ditemukan untuk wali kelas ini.",
        },
        { status: 404 }
      );
    }

    // Pilih kelas yang punya siswa aktif, jika tidak ada ambil yang terbaru
    let kelas = allClasses.find((cls) => cls.students.length > 0);

    // Jika tidak ada kelas dengan siswa aktif, ambil kelas terbaru
    if (!kelas) {
      kelas = allClasses[0];
    }

    const { students } = kelas;

    // 🔥 Hitung total students
    const totalStudents = students.length;

    // 🔥 Hitung total presensi siswa di kelas ini (filter by academic year)
    const totalAttendances = await prisma.attendance.count({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
      },
    });

    // 🔥 Hitung total assignments (filter by class)
    const totalAssignments = await prisma.assignment.count({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
      },
    });

    // 🔥 Hitung rata-rata nilai siswa dari FinalScore tahun ajaran ini
    const studentIds = students.map((s) => s.id);

    const finalScores = await prisma.finalScore.findMany({
      where: {
        studentId: { in: studentIds },
        tahunAjaranId: kelas.academicYearId,
      },
    });

    // Hitung rata-rata dari nilai akhir
    const averageScore =
      finalScores.length > 0
        ? parseFloat(
            (
              finalScores.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) /
              finalScores.length
            ).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      success: true,
      totalStudents,
      totalAttendances,
      totalAssignments,
      averageScore,
      totalFinalScores: finalScores.length,
      classInfo: {
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        program: kelas.program?.namaPaket,
        academicYear: {
          id: kelas.academicYear.id,
          tahunMulai: kelas.academicYear.tahunMulai,
          tahunSelesai: kelas.academicYear.tahunSelesai,
          semester: kelas.academicYear.semester,
          isActive: kelas.academicYear.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Gagal memuat overview dashboard wali kelas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat overview." },
      { status: 500 }
    );
  }
}
