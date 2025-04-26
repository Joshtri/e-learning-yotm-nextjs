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
          assignment: {
            isNot: null,
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
                  class: { select: { namaKelas: true } },
                  subject: { select: { namaMapel: true } },
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
                  class: { select: { namaKelas: true } },
                  subject: { select: { namaMapel: true } },
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
      return {
        id: item.id,
        tipe: type,
        judul: source?.judul || "-",
        kelas: source?.classSubjectTutor?.class?.namaKelas || "-",
        mapel: source?.classSubjectTutor?.subject?.namaMapel || "-",
        nilai: item.nilai ?? 0,
        status: item.status,
        waktuKumpul: item.waktuKumpul,
      };
    };

    const otherScores = [
      ...exerciseSubmissions.map((item) => transformSubmission(item, "TUGAS")),
      ...quizSubmissions.map((item) => transformSubmission(item, "KUIS")),
    ];

    const response = NextResponse.json({
      success: true,
      data: otherScores,
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
