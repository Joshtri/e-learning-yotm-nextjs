import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const { id } = params;

  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
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

    const allowedCstIds = student.class.classSubjectTutors.map((cst) => cst.id);

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { id: "asc" },
        },
        classSubjectTutor: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!quiz) {
      return new Response(JSON.stringify({ message: "Kuis tidak ditemukan" }), {
        status: 404,
      });
    }

    if (!allowedCstIds.includes(quiz.classSubjectTutorId)) {
      return new Response(JSON.stringify({ message: "Unauthorized access" }), {
        status: 403,
      });
    }

    return NextResponse.json({ success: true, data: quiz });
  } catch (err) {
    console.error("Gagal ambil detail kuis:", err);
    return new Response(
      JSON.stringify({ message: "Gagal memuat detail kuis" }),
      { status: 500 }
    );
  }
}
