import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        class: {
          include: {
            classSubjectTutors: true,
          },
        },
      },
    });

    if (!student || !student.class) {
      return NextResponse.json(
        { success: false, message: "Student or class not found" },
        { status: 404 }
      );
    }

    const studentId = student.id;
    const cstIds = student.class.classSubjectTutors.map((cst) => cst.id);

    const quizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutorId: { in: cstIds },
      },
      include: {
        classSubjectTutor: {
          include: {
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
            class: { select: { namaKelas: true } },
          },
        },
        submissions: {
          where: {
            studentId,
            status: "SUBMITTED",
          },
          select: {
            id: true,
            nilai: true,
          },
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
      const sudahDikerjakan = quiz.submissions.length > 0;
      const totalPoin = quiz._count.questions > 0 ? 100 : 0;
      return {
        ...quiz,
        sudahDikerjakan,
        totalPoin,
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
