import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(request) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetAcademicYearId } = body;

    if (!targetAcademicYearId) {
      return NextResponse.json(
        { success: false, message: "Target tahun akademik tidak valid" },
        { status: 400 }
      );
    }

    // Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Cari kelas saat ini (kelas yang masih memiliki siswa aktif)
    const currentClass = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        students: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        academicYear: true,
        program: true,
        students: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } }, // GENAP first, then GANJIL
      ],
    });

    if (!currentClass) {
      return NextResponse.json(
        { success: false, message: "Kelas saat ini tidak ditemukan" },
        { status: 404 }
      );
    }

    // ✅ Validasi: Hanya bisa pindah dari GANJIL ke GENAP
    if (currentClass.academicYear.semester !== "GANJIL") {
      return NextResponse.json(
        {
          success: false,
          message: "Pindah semester hanya bisa dilakukan dari semester GANJIL ke GENAP",
          currentSemester: currentClass.academicYear.semester,
        },
        { status: 403 }
      );
    }

    // Cari tahun akademik tujuan
    const targetAcademicYear = await prisma.academicYear.findUnique({
      where: { id: targetAcademicYearId },
    });

    if (!targetAcademicYear) {
      return NextResponse.json(
        { success: false, message: "Tahun akademik tujuan tidak ditemukan" },
        { status: 404 }
      );
    }

    // ✅ Validasi: Target harus GENAP dan tahun yang sama
    if (targetAcademicYear.semester !== "GENAP") {
      return NextResponse.json(
        {
          success: false,
          message: "Target semester harus GENAP",
        },
        { status: 400 }
      );
    }

    if (
      targetAcademicYear.tahunMulai !== currentClass.academicYear.tahunMulai ||
      targetAcademicYear.tahunSelesai !== currentClass.academicYear.tahunSelesai
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Pindah semester harus dalam tahun ajaran yang sama",
        },
        { status: 400 }
      );
    }

    // Cari atau buat kelas baru di tahun akademik tujuan dengan nama yang sama
    let targetClass = await prisma.class.findFirst({
      where: {
        namaKelas: currentClass.namaKelas,
        programId: currentClass.programId,
        academicYearId: targetAcademicYearId,
      },
    });

    // Jika kelas belum ada, buat kelas baru
    if (!targetClass) {
      targetClass = await prisma.class.create({
        data: {
          namaKelas: currentClass.namaKelas,
          programId: currentClass.programId,
          academicYearId: targetAcademicYearId,
          homeroomTeacherId: tutor.id, // Wali kelas tetap sama
        },
      });

      // ✅ Regenerasi ClassSubjectTutor (Pembagian Jadwal Belajar) dari semester GANJIL ke GENAP
      const ganjilSchedules = await prisma.classSubjectTutor.findMany({
        where: { classId: currentClass.id },
        select: {
          tutorId: true,
          subjectId: true,
        },
      });

      // Buat jadwal yang sama untuk kelas GENAP
      if (ganjilSchedules.length > 0) {
        await prisma.classSubjectTutor.createMany({
          data: ganjilSchedules.map((schedule) => ({
            tutorId: schedule.tutorId,
            classId: targetClass.id,
            subjectId: schedule.subjectId,
          })),
        });
      }
    }

    // ✅ Validasi kelengkapan nilai untuk semua siswa di semester GANJIL
    const subjects = await prisma.classSubjectTutor.findMany({
      where: { classId: currentClass.id },
      include: { subject: true },
      distinct: ["subjectId"],
    });

    const subjectIds = subjects.map((cst) => cst.subject.id);
    const subjectList = subjects.map((cst) => ({
      id: cst.subject.id,
      nama: cst.subject.namaMapel,
    }));

    // Cek setiap siswa
    const invalidStudents = [];
    for (const student of currentClass.students) {
      const issues = [];

      // ✅ Cek FinalScore semester GANJIL sudah lengkap dengan detail mata pelajaran
      const existingFinalScores = await prisma.finalScore.findMany({
        where: {
          studentId: student.id,
          tahunAjaranId: currentClass.academicYearId,
          subjectId: { in: subjectIds },
        },
        select: {
          subjectId: true,
        },
      });

      const existingSubjectIds = existingFinalScores.map(fs => fs.subjectId);
      const missingSubjects = subjectList.filter(
        subj => !existingSubjectIds.includes(subj.id)
      );

      if (missingSubjects.length > 0) {
        issues.push({
          type: "FINAL_SCORE",
          message: `Nilai akhir belum lengkap (${existingFinalScores.length}/${subjects.length} mata pelajaran)`,
          detail: `Mata pelajaran yang belum ada nilai akhir: ${missingSubjects.map(s => s.nama).join(", ")}`,
          missing: missingSubjects,
        });
      }

      // Cek BehaviorScore
      const behaviorScore = await prisma.behaviorScore.findUnique({
        where: {
          studentId_classId_academicYearId: {
            studentId: student.id,
            classId: currentClass.id,
            academicYearId: currentClass.academicYearId,
          },
        },
      });

      if (!behaviorScore) {
        issues.push({
          type: "BEHAVIOR",
          message: "Nilai sikap & kehadiran belum ada",
          detail: "Silakan lengkapi nilai sikap dan kehadiran terlebih dahulu",
        });
      }

      if (issues.length > 0) {
        invalidStudents.push({
          id: student.id,
          namaLengkap: student.namaLengkap,
          nisn: student.nisn,
          issues,
        });
      }
    }

    // Jika ada siswa yang belum valid, tolak pemindahan
    if (invalidStudents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak bisa memindahkan siswa karena ada nilai yang belum lengkap di semester GANJIL",
          invalidStudents,
        },
        { status: 400 }
      );
    }

    // ✅ Pindahkan semua siswa dengan menghitung nilaiAkhir
    await prisma.$transaction(async (tx) => {
      for (const student of currentClass.students) {
        // Hitung rata-rata nilai akhir dari FinalScore semester GANJIL
        const finalScores = await tx.finalScore.findMany({
          where: {
            studentId: student.id,
            tahunAjaranId: currentClass.academicYearId,
            subjectId: { in: subjectIds },
          },
        });

        const nilaiAkhir = finalScores.length > 0
          ? finalScores.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) / finalScores.length
          : null;

        // Update classId siswa ke kelas semester GENAP
        await tx.student.update({
          where: { id: student.id },
          data: { classId: targetClass.id },
        });

        // Buat history semester GANJIL
        await tx.studentClassHistory.create({
          data: {
            studentId: student.id,
            classId: currentClass.id,
            academicYearId: currentClass.academicYearId,
            naikKelas: true, // Pindah ke semester GENAP
            nilaiAkhir: nilaiAkhir ? parseFloat(nilaiAkhir.toFixed(2)) : null,
          },
        });
      }
    });

    // ❌ JANGAN update status tahun akademik otomatis
    // Biarkan admin yang mengelola aktivasi tahun akademik secara manual
    // Karena wali kelas/tutor lain mungkin belum siap memindahkan siswa mereka

    // Note: Admin yang akan mengaktifkan tahun akademik GENAP ketika semua kelas sudah siap

    return NextResponse.json({
      success: true,
      message: `Berhasil memindahkan ${currentClass.students.length} siswa ke ${targetAcademicYear.tahunMulai}/${targetAcademicYear.tahunSelesai} - Semester ${targetAcademicYear.semester}`,
      data: {
        movedStudents: currentClass.students.length,
        fromClass: {
          nama: currentClass.namaKelas,
          tahunAjaran: `${currentClass.academicYear.tahunMulai}/${currentClass.academicYear.tahunSelesai}`,
          semester: currentClass.academicYear.semester,
        },
        toClass: {
          nama: targetClass.namaKelas,
          tahunAjaran: `${targetAcademicYear.tahunMulai}/${targetAcademicYear.tahunSelesai}`,
          semester: targetAcademicYear.semester,
        },
      },
    });
  } catch (error) {
    console.error("Error moving students to new semester:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    );
  }
}
