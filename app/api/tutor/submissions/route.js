// app/api/tutor/submissions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request) {
  try {
    // 1. Autentikasi user dengan role TUTOR
    const { user, error, status } = await getAuthUser(request, ["TUTOR"]);
    if (error || !user) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status }
      );
    }

    // 2. Cek tutor berdasarkan userId
    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    // 3. Ambil academicYearId dari query atau default ke tahun aktif
    const { searchParams } = new URL(request.url);
    let academicYearId = searchParams.get("academicYearId");

    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      academicYearId = activeYear?.id || null;
    }

    // 4. Get subjectId filter from query params
    const subjectId = searchParams.get("subjectId");

    // 5. Query data submissions berdasarkan class.academicYearId dan optional subjectId
    // Exclude MIDTERM dan FINAL_EXAM karena itu khusus untuk ujian sekolah
    const submissions = await prisma.submission.findMany({
      where: {
        OR: [
          {
            assignmentId: { not: null },
            assignment: {
              jenis: {
                notIn: ["MIDTERM", "FINAL_EXAM"], // Exclude UTS dan UAS
              },
              classSubjectTutor: {
                tutorId: tutor.id,
                class: academicYearId ? { academicYearId } : undefined,
                ...(subjectId && { subjectId }),
              },
            },
          },
          {
            quizId: { not: null },
            quiz: {
              classSubjectTutor: {
                tutorId: tutor.id,
                class: academicYearId ? { academicYearId } : undefined,
                ...(subjectId && { subjectId }),
              },
            },
          },
        ],
      },
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        quizId: true,
        status: true,
        waktuMulai: true,
        waktuKumpul: true,
        nilai: true,
        waktuDinilai: true,
        feedback: true,
        createdAt: true,
        // Exclude answerPdf for performance - only load it in detail view
        student: {
          select: {
            id: true,
            namaLengkap: true,
            nisn: true,
          },
        },
        assignment: {
          select: {
            id: true,
            judul: true,
            jenis: true,
            classSubjectTutor: {
              select: {
                id: true,
                class: {
                  select: {
                    namaKelas: true,
                    academicYearId: true,
                  },
                },
                subject: {
                  select: {
                    id: true,
                    namaMapel: true,
                  },
                },
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            judul: true,
            classSubjectTutor: {
              select: {
                id: true,
                class: {
                  select: {
                    namaKelas: true,
                    academicYearId: true,
                  },
                },
                subject: {
                  select: {
                    id: true,
                    namaMapel: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 6. Get available subjects for filtering
    const availableSubjects = await prisma.subject.findMany({
      where: {
        classSubjectTutors: {
          some: {
            tutorId: tutor.id,
            class: academicYearId ? { academicYearId } : undefined,
          },
        },
      },
      select: {
        id: true,
        namaMapel: true,
      },
      orderBy: {
        namaMapel: "asc",
      },
    });

    // 7. Group submissions by subject and type
    const groupedSubmissions = {};

    submissions.forEach((submission) => {
      const subject =
        submission.assignment?.classSubjectTutor?.subject ||
        submission.quiz?.classSubjectTutor?.subject;

      if (!subject) return;

      const subjectKey = subject.namaMapel;
      if (!groupedSubmissions[subjectKey]) {
        groupedSubmissions[subjectKey] = {
          subjectId: subject.id,
          subjectName: subject.namaMapel,
          assignmentsByType: {
            MATERIAL: [],
            EXERCISE: [],
            QUIZ: [],
            DAILY_TEST: [],
            START_SEMESTER_TEST: [],
          },
          quizzes: [],
        };
      }

      if (submission.assignment) {
        const jenis = submission.assignment.jenis;
        if (groupedSubmissions[subjectKey].assignmentsByType[jenis]) {
          groupedSubmissions[subjectKey].assignmentsByType[jenis].push(submission);
        }
      } else if (submission.quiz) {
        groupedSubmissions[subjectKey].quizzes.push(submission);
      }
    });

    return NextResponse.json({
      success: true,
      data: subjectId ? submissions : groupedSubmissions,
      availableSubjects,
      isFiltered: !!subjectId,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal ambil submissions" },
      { status: 500 }
    );
  }
}
