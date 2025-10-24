// File: app/api/homeroom/promote-students/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function PATCH(req) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { promotions, targetAcademicYearId, targetClassIdForPassed, targetClassIdForFailed } = body;

    if (!Array.isArray(promotions)) {
      return new Response(
        JSON.stringify({ success: false, message: "Data tidak valid" }),
        { status: 400 }
      );
    }

    if (!targetAcademicYearId || !targetClassIdForPassed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Target tahun ajaran dan kelas tujuan (naik kelas) harus diisi",
        }),
        { status: 400 }
      );
    }

    // Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Cari kelas saat ini (tahun ajaran aktif)
    const currentClass = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: { isActive: true },
      },
      include: {
        academicYear: true,
        program: true,
      },
    });

    if (!currentClass) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // ✅ Validasi: Hanya bisa di semester GENAP
    if (currentClass.academicYear.semester !== "GENAP") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kenaikan kelas hanya bisa dilakukan di semester GENAP",
          currentSemester: currentClass.academicYear.semester,
        }),
        { status: 403 }
      );
    }

    // Cari tahun akademik tujuan
    const targetAcademicYear = await prisma.academicYear.findUnique({
      where: { id: targetAcademicYearId },
    });

    if (!targetAcademicYear) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun akademik tujuan tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    // ✅ Validasi: Target harus GANJIL (tahun ajaran baru dimulai dari GANJIL)
    if (targetAcademicYear.semester !== "GANJIL") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kenaikan kelas harus ke semester GANJIL di tahun ajaran baru",
        }),
        { status: 400 }
      );
    }

    // ✅ Ambil mata pelajaran di kelas saat ini
    const subjects = await prisma.classSubjectTutor.findMany({
      where: { classId: currentClass.id },
      include: { subject: true },
      distinct: ["subjectId"],
    });

    const subjectIds = subjects.map((cst) => cst.subject.id);

    // ✅ Validasi kelas tujuan untuk siswa yang NAIK (harus sudah dibuat admin)
    const targetClassForPassed = await prisma.class.findUnique({
      where: { id: targetClassIdForPassed },
      include: { academicYear: true, program: true },
    });

    if (!targetClassForPassed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kelas tujuan untuk siswa yang naik tidak ditemukan. Hubungi admin untuk membuat kelas terlebih dahulu.",
        }),
        { status: 404 }
      );
    }

    // Validasi kelas tujuan harus di tahun ajaran yang dipilih
    if (targetClassForPassed.academicYearId !== targetAcademicYearId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kelas tujuan tidak sesuai dengan tahun ajaran yang dipilih",
        }),
        { status: 400 }
      );
    }

    // ✅ Validasi kelas mengulang untuk siswa yang TIDAK NAIK (optional, bisa null)
    let targetClassForFailed = null;
    if (targetClassIdForFailed) {
      targetClassForFailed = await prisma.class.findUnique({
        where: { id: targetClassIdForFailed },
        include: { academicYear: true, program: true },
      });

      if (!targetClassForFailed) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kelas untuk siswa yang tidak naik tidak ditemukan",
          }),
          { status: 404 }
        );
      }

      // Validasi kelas mengulang juga harus di tahun ajaran baru
      if (targetClassForFailed.academicYearId !== targetAcademicYearId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kelas mengulang tidak sesuai dengan tahun ajaran yang dipilih",
          }),
          { status: 400 }
        );
      }
    }

    // ✅ Ambil tahun ajaran semester GANJIL (untuk validasi nilai semester GANJIL)
    const ganjilAcademicYear = await prisma.academicYear.findFirst({
      where: {
        tahunMulai: currentClass.academicYear.tahunMulai,
        tahunSelesai: currentClass.academicYear.tahunSelesai,
        semester: "GANJIL",
      },
    });

    if (!ganjilAcademicYear) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun ajaran semester GANJIL tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    // ✅ Validasi dan proses kenaikan kelas
    const processedStudents = [];
    const invalidStudents = [];

    for (const promotion of promotions) {
      const student = await prisma.student.findUnique({
        where: { id: promotion.studentId },
      });

      if (!student) continue;

      const issues = [];

      // ✅ Cek FinalScore semester GANJIL
      const ganjilScoreCount = await prisma.finalScore.count({
        where: {
          studentId: student.id,
          tahunAjaranId: ganjilAcademicYear.id,
          subjectId: { in: subjectIds },
        },
      });

      if (ganjilScoreCount < subjects.length) {
        issues.push(
          `Nilai semester GANJIL belum lengkap (${ganjilScoreCount}/${subjects.length})`
        );
      }

      // ✅ Cek FinalScore semester GENAP
      const genapScoreCount = await prisma.finalScore.count({
        where: {
          studentId: student.id,
          tahunAjaranId: currentClass.academicYearId,
          subjectId: { in: subjectIds },
        },
      });

      if (genapScoreCount < subjects.length) {
        issues.push(
          `Nilai semester GENAP belum lengkap (${genapScoreCount}/${subjects.length})`
        );
      }

      if (issues.length > 0) {
        invalidStudents.push({
          id: student.id,
          namaLengkap: student.namaLengkap,
          issues,
        });
      } else {
        processedStudents.push({ student, naikKelas: promotion.naikKelas });
      }
    }

    // Jika ada siswa yang belum valid, tolak kenaikan kelas
    if (invalidStudents.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Tidak bisa memproses kenaikan kelas karena ada nilai yang belum lengkap",
          invalidStudents,
        }),
        { status: 400 }
      );
    }

    // ✅ Proses kenaikan kelas dengan transaction
    let passedCount = 0;
    let failedCount = 0;
    let notProcessedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const { student, naikKelas } of processedStudents) {
        // Ambil FinalScore semester GANJIL
        const ganjilScores = await tx.finalScore.findMany({
          where: {
            studentId: student.id,
            tahunAjaranId: ganjilAcademicYear.id,
            subjectId: { in: subjectIds },
          },
        });

        // Ambil FinalScore semester GENAP
        const genapScores = await tx.finalScore.findMany({
          where: {
            studentId: student.id,
            tahunAjaranId: currentClass.academicYearId,
            subjectId: { in: subjectIds },
          },
        });

        // ✅ Hitung rata-rata nilai GANJIL + GENAP
        const allScores = [...ganjilScores, ...genapScores];
        const nilaiAkhir =
          allScores.length > 0
            ? allScores.reduce((sum, fs) => sum + fs.nilaiAkhir, 0) /
              allScores.length
            : null;

        // Buat history semester GENAP dengan nilai gabungan
        await tx.studentClassHistory.create({
          data: {
            studentId: student.id,
            classId: currentClass.id,
            academicYearId: currentClass.academicYearId,
            naikKelas: naikKelas,
            nilaiAkhir: nilaiAkhir ? parseFloat(nilaiAkhir.toFixed(2)) : null,
          },
        });

        // ✅ Jika naik kelas, pindahkan ke kelas naik tingkat
        if (naikKelas) {
          await tx.student.update({
            where: { id: student.id },
            data: {
              classId: targetClassForPassed.id, // Pindah ke kelas tingkat berikutnya
              naikKelas: false, // Reset flag
              diprosesNaik: true,
            },
          });
          passedCount++;
        } else {
          // ✅ Tidak naik kelas (mengulang)
          if (targetClassForFailed) {
            // Jika ada kelas mengulang yang ditentukan, pindahkan ke sana
            await tx.student.update({
              where: { id: student.id },
              data: {
                classId: targetClassForFailed.id, // Pindah ke kelas mengulang
                naikKelas: false,
                diprosesNaik: true,
              },
            });
            failedCount++;
          } else {
            // Jika tidak ada kelas mengulang, siswa tetap di kelas lama (tidak dipindahkan)
            await tx.student.update({
              where: { id: student.id },
              data: {
                naikKelas: false,
                diprosesNaik: true,
                // classId tetap sama (tidak dipindahkan)
              },
            });
            notProcessedCount++;
          }
        }
      }
    });

    // ❌ JANGAN update status tahun akademik otomatis
    // Biarkan admin yang mengelola aktivasi tahun akademik secara manual
    // Karena wali kelas/tutor lain mungkin belum selesai memproses kenaikan kelas siswa mereka

    // Note: Admin yang akan mengaktifkan tahun akademik baru ketika SEMUA kelas sudah selesai naik kelas

    return new Response(
      JSON.stringify({
        success: true,
        message: `Berhasil memproses kenaikan kelas: ${passedCount} siswa naik kelas${failedCount > 0 ? `, ${failedCount} siswa mengulang` : ""}${notProcessedCount > 0 ? `, ${notProcessedCount} siswa belum dipindahkan` : ""}`,
        data: {
          passedStudents: passedCount,
          failedStudents: failedCount,
          notProcessedStudents: notProcessedCount,
          fromClass: {
            nama: currentClass.namaKelas,
            tahunAjaran: `${currentClass.academicYear.tahunMulai}/${currentClass.academicYear.tahunSelesai}`,
            semester: currentClass.academicYear.semester,
          },
          targetClassForPassed: {
            nama: targetClassForPassed.namaKelas,
            tahunAjaran: `${targetClassForPassed.academicYear.tahunMulai}/${targetClassForPassed.academicYear.tahunSelesai}`,
            semester: targetClassForPassed.academicYear.semester,
          },
          targetClassForFailed: targetClassForFailed ? {
            nama: targetClassForFailed.namaKelas,
            tahunAjaran: `${targetClassForFailed.academicYear.tahunMulai}/${targetClassForFailed.academicYear.tahunSelesai}`,
            semester: targetClassForFailed.academicYear.semester,
          } : null,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR PROMOTE STUDENTS]", error);
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
