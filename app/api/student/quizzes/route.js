import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = user.id;

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        class: {
          include: {
            classSubjectTutors: true,
            academicYear: true,
          },
        },
      },
    });

    if (!student || !student.class) {
      return NextResponse.json(
        { success: false, message: "Student or class not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(req.url);
    const queryAcademicYearId = searchParams.get("academicYearId");
    const querySemester = searchParams.get("semester");

    const studentId = student.id;

    // Get all class IDs the student has ever been associated with
    const studentClassHistory = await prisma.studentClassHistory.findMany({
      where: { studentId: student.id },
      select: { classId: true },
    });
    const allClassIds = [
      student.class.id,
      ...studentClassHistory.map((history) => history.classId),
    ];

    // Get all ClassSubjectTutor IDs for these classes
    const allCst = await prisma.classSubjectTutor.findMany({
      where: { classId: { in: allClassIds } },
      select: { id: true },
    });
    const cstIds = allCst.map((cst) => cst.id);

    const whereClause = {
      classSubjectTutorId: { in: cstIds },
      classSubjectTutor: {
        class: {
          academicYearId: queryAcademicYearId,
          academicYear: {
            semester: querySemester,
          },
        },
      },
    };

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: {
        classSubjectTutor: {
          include: {
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
            class: {
              select: {
                namaKelas: true,
                academicYear: {
                  select: {
                    tahunMulai: true,
                    tahunSelesai: true,
                    semester: true,
                  },
                },
              },
            },
          },
        },
        submissions: {
          where: {
            studentId,
          },
          select: {
            id: true,
            nilai: true,
            attemptCount: true,
            highestScore: true,
          },
          take: 1, // Hanya ambil 1 submission (seharusnya cuma ada 1)
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: { waktuMulai: "asc" },
    });

    const formatted = quizzes.map((quiz) => {
      const submission = quiz.submissions[0]; // Hanya ada 1 submission per quiz
      const totalAttempts = submission?.attemptCount || 0;
      const highestScore = submission?.highestScore || null;
      const sudahDikerjakan = totalAttempts > 0;
      const totalPoin = quiz._count.questions > 0 ? 100 : 0;

      return {
        ...quiz,
        sudahDikerjakan,
        totalPoin,
        totalAttempts,
        highestScore,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Gagal ambil semua kuis:", error);
    return new Response(JSON.stringify({ message: "Gagal memuat kuis" }), {
      status: 500,
    });
  }
}
