import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

function getUserFromCookie() {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(_, { params }) {
  const { id } = params;
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        classSubjectTutor: { tutorId: tutor.id },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              include: { academicYear: true, program: true },
            },
            subject: true,
            tutor: { include: { user: true } },
          },
        },
        questions: {
          include: { options: true },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: true,
                class: {
                  include: { academicYear: true, program: true },
                },
              },
            },
            answers: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        {
          success: false,
          message: "Kuis tidak ditemukan atau Anda tidak memiliki akses",
        },
        { status: 404 }
      );
    }

    quiz.questions = quiz.questions.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    return NextResponse.json({ success: true, data: quiz });
  } catch (error) {
    console.error("Gagal ambil detail kuis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat detail kuis",
      },
      { status: 500 }
    );
  }
}
