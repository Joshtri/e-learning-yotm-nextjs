import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (
      !user ||
      (user.role !== "STUDENT" && user.role !== "HOMEROOM_TEACHER")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const [exerciseSubmissions, quizSubmissions] = await Promise.all([
      prisma.submission.findMany({
        where: {
          studentId: student.id,
          assignmentId: { not: null },
          assignment: {
            jenis: {
              notIn: ["MIDTERM", "FINAL_EXAM", "DAILY_TEST", "START_SEMESTER_TEST"], // ✅ Filter exam types
            },
            NOT: {
              judul: {
                contains: "Ujian", // ✅ Exclude items with "Ujian" in title
              },
            },
          },
          status: "GRADED", // ✅ Tugas tetap hanya GRADED
        },
        select: {
          id: true,
          nilai: true,
          status: true,
          waktuKumpul: true,
          assignment: {
            select: {
              judul: true,
              classSubjectTutor: {
                select: {
                  class: {
                    select: {
                      namaKelas: true,
                      academicYear: { select: { id: true, tahunMulai: true, tahunSelesai: true, semester: true } },
                    },
                  },
                  subject: { select: { id: true, namaMapel: true } },
                },
              },
            },
          },
        },
        orderBy: { waktuKumpul: "desc" },
      }),
      prisma.submission.findMany({
        where: {
          studentId: student.id,
          quizId: { not: null },
          quiz: {
            NOT: {
              judul: {
                contains: "Ujian", // ✅ Exclude items with "Ujian" in title
              },
            },
          },
          status: {
            in: ["GRADED", "SUBMITTED"], // ✅ Kuis: GRADED atau SUBMITTED
          },
        },
        select: {
          id: true,
          nilai: true,
          status: true,
          waktuKumpul: true,
          quiz: {
            select: {
              judul: true,
              classSubjectTutor: {
                select: {
                  class: {
                    select: {
                      namaKelas: true,
                      academicYear: { select: { id: true, tahunMulai: true, tahunSelesai: true, semester: true } },
                    },
                  },
                  subject: { select: { id: true, namaMapel: true } },
                },
              },
            },
          },
        },
        orderBy: { waktuKumpul: "desc" },
      }),
    ]);

    const transformSubmission = (item, type) => {
      const source = type === "KUIS" ? item.quiz : item.assignment;
      const academicYear = source?.classSubjectTutor?.class?.academicYear;
      return {
        id: item.id,
        tipe: type,
        judul: source?.judul || "-",
        kelas: source?.classSubjectTutor?.class?.namaKelas || "-",
        mapel: source?.classSubjectTutor?.subject?.namaMapel || "-",
        mapelId: source?.classSubjectTutor?.subject?.id || "-",
        nilai: item.nilai ?? 0,
        status: item.status,
        waktuKumpul: item.waktuKumpul,
        academicYearId: academicYear?.id || "-",
        tahunAjaran: academicYear
          ? `${academicYear.tahunMulai}/${academicYear.tahunSelesai} - ${academicYear.semester}`
          : "-",
      };
    };

    const otherScores = [
      ...exerciseSubmissions.map((item) => transformSubmission(item, "TUGAS")),
      ...quizSubmissions.map((item) => transformSubmission(item, "KUIS")),
    ];

    // Extract unique academic years and subjects from the data
    const academicYearsMap = new Map();
    const subjectsSet = new Map();

    otherScores.forEach((score) => {
      if (score.academicYearId !== "-") {
        academicYearsMap.set(score.academicYearId, score.tahunAjaran);
      }
      if (score.mapelId !== "-") {
        subjectsSet.set(score.mapelId, score.mapel);
      }
    });

    const filterOptions = {
      academicYears: Array.from(academicYearsMap, ([id, label]) => ({ id, label })),
      subjects: Array.from(subjectsSet, ([id, label]) => ({ id, label })),
    };

    const response = NextResponse.json({
      success: true,
      data: otherScores,
      filterOptions,
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error("[OTHER_SCORES_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data nilai tugas dan kuis" },
      { status: 500 }
    );
  }
}
