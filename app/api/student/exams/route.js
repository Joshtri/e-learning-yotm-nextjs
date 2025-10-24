import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        classId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    console.log("=== STUDENT EXAMS API ===");
    console.log("Student ID:", student.id);
    console.log("Student Class ID:", student.classId);
    console.log("Academic Year ID from params:", academicYearId);

    // Build where clause for assignments
    let whereClause = {
      jenis: {
        in: ["MIDTERM", "FINAL_EXAM"], // Only UTS and UAS
      },
    };

    // Add class filter based on academicYearId
    if (academicYearId) {
      whereClause.classSubjectTutor = {
        class: {
          academicYearId: academicYearId,
        },
      };
    } else {
      // Default: get active academic year
      whereClause.classSubjectTutor = {
        class: {
          academicYear: {
            isActive: true,
          },
        },
      };
    }

    console.log("Where Clause:", JSON.stringify(whereClause, null, 2));

    // Fetch all exams (UTS & UAS)
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        classSubjectTutor: {
          include: {
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
            class: {
              include: {
                academicYear: {
                  select: {
                    id: true,
                    tahunMulai: true,
                    tahunSelesai: true,
                    semester: true,
                    isActive: true,
                  },
                },
              },
            },
            tutor: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
        submissions: {
          where: {
            studentId: student.id,
          },
          select: {
            id: true,
            status: true,
            nilai: true,
            waktuMulai: true,
            waktuKumpul: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        TanggalMulai: "desc",
      },
    });

    console.log(`Found ${assignments.length} exams`);

    // Transform data
    const exams = assignments.map((exam) => {
      const submission = exam.submissions[0]; // Get student's submission if exists
      const academicYear = exam.classSubjectTutor?.class?.academicYear;

      // Determine exam status dengan normalisasi UTC
      let status = "Belum Tersedia";
      let canStart = false;
      const now = new Date();
      const currentDateUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

      const startDate = exam.TanggalMulai ? new Date(exam.TanggalMulai) : null;
      const startDateUTC = startDate ? Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;

      const endDate = exam.TanggalSelesai ? new Date(exam.TanggalSelesai) : null;
      const endDateUTC = endDate ? Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;

      if (submission) {
        if (submission.status === "GRADED") {
          status = "Selesai Dinilai";
        } else if (submission.status === "SUBMITTED") {
          status = "Menunggu Penilaian";
        } else if (submission.status === "IN_PROGRESS") {
          status = "Sedang Dikerjakan";
          canStart = true;
        }
      } else if (startDateUTC && endDateUTC) {
        if (currentDateUTC >= startDateUTC && currentDateUTC <= endDateUTC) {
          status = "Tersedia";
          canStart = true;
        } else if (currentDateUTC < startDateUTC) {
          status = "Belum Dimulai";
        } else {
          status = "Sudah Berakhir";
        }
      }

      return {
        id: exam.id,
        judul: exam.judul,
        deskripsi: exam.deskripsi,
        jenis: exam.jenis,
        jenisDeskripsi:
          exam.jenis === "MIDTERM"
            ? "Ujian Tengah Semester (UTS)"
            : "Ujian Akhir Semester (UAS)",
        TanggalMulai: exam.TanggalMulai,
        TanggalSelesai: exam.TanggalSelesai,
        batasWaktuMenit: exam.batasWaktuMenit,
        nilaiMaksimal: exam.nilaiMaksimal,
        jumlahSoal: exam.questions.length,
        subject: exam.classSubjectTutor?.subject || null,
        tutor: exam.classSubjectTutor?.tutor || null,
        class: {
          namaKelas: exam.classSubjectTutor?.class?.namaKelas,
          academicYear: academicYear
            ? {
                id: academicYear.id,
                tahunMulai: academicYear.tahunMulai,
                tahunSelesai: academicYear.tahunSelesai,
                semester: academicYear.semester,
                display: `${academicYear.tahunMulai}/${academicYear.tahunSelesai} - ${academicYear.semester}`,
              }
            : null,
        },
        submission: submission
          ? {
              id: submission.id,
              status: submission.status,
              nilai: submission.nilai,
              waktuMulai: submission.waktuMulai,
              waktuKumpul: submission.waktuKumpul,
            }
          : null,
        status,
        canStart,
        sudahDikerjakan: !!submission,
      };
    });

    console.log(`Returning ${exams.length} exams`);

    return NextResponse.json(
      {
        success: true,
        data: exams,
        count: exams.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR in /api/student/exams:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat data ujian",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
