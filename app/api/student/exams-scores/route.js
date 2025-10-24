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
        classId: true
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // Get academicYearId from query parameters
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    console.log("=== STUDENT EXAMS-SCORES API ===");
    console.log("Student ID:", student.id);
    console.log("Student Class ID:", student.classId);
    console.log("Academic Year ID from params:", academicYearId);

    // Build where clause for submissions
    let whereClause = {
      studentId: student.id,
      assignmentId: { not: null },
      status: { in: ["SUBMITTED", "GRADED"] },
      assignment: {
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"],
        },
      },
    };

    // If academicYearId is provided, filter by it
    if (academicYearId) {
      whereClause.assignment.classSubjectTutor = {
        class: {
          academicYearId: academicYearId,
        },
      };
    } else {
      // Default: get active academic year
      whereClause.assignment.classSubjectTutor = {
        class: {
          academicYear: {
            isActive: true,
          },
        },
      };
    }

    console.log("Where Clause:", JSON.stringify(whereClause, null, 2));

    // Fetch all exam submissions for this student
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        assignment: {
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(`Found ${submissions.length} submissions`);

    // Transform data to match frontend expectations
    const scores = submissions.map((submission) => {
      const nilai = submission.nilai ?? 0;
      const nilaiMaksimal = submission.assignment?.nilaiMaksimal ?? 100;
      const jenis = submission.assignment?.jenis;

      // Calculate passing threshold (75% of max score)
      const passingScore = nilaiMaksimal * 0.75;
      const statusKelulusan = nilai >= passingScore ? "LULUS" : "TIDAK LULUS";

      const academicYear = submission.assignment?.classSubjectTutor?.class?.academicYear;

      return {
        id: submission.id,
        title: submission.assignment?.judul || "-",
        subject: submission.assignment?.classSubjectTutor?.subject || null,
        tutor: submission.assignment?.classSubjectTutor?.tutor || null,
        jenis,
        nilai,
        nilaiMaksimal,
        statusKelulusan,
        tahunAjaran: academicYear
          ? `${academicYear.tahunMulai}/${academicYear.tahunSelesai}`
          : "-",
        semester: academicYear?.semester || "-",
        academicYearId: academicYear?.id || null,
        submittedAt: submission.waktuKumpul,
        gradedAt: submission.waktuDinilai,
        feedback: submission.feedback,
      };
    });

    console.log(`Returning ${scores.length} exam scores`);

    return NextResponse.json(
      {
        success: true,
        data: scores,
        count: scores.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR in /api/student/exams-scores:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat nilai ujian",
        error: error.message
      },
      { status: 500 }
    );
  }
}
