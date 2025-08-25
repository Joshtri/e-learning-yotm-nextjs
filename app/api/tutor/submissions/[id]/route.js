import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissionId = params.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        assignment: {
          include: {
            classSubjectTutor: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
        quiz: {
          include: {
            classSubjectTutor: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        status: submission.status,
        nilai: submission.nilai,
        feedback: submission.feedback,
        waktuKumpul: submission.waktuKumpul,
        waktuMulai: submission.waktuMulai,
        createdAt: submission.createdAt,
        answerPdf: submission.answerPdf, // Include answerPdf for review
        student: {
          id: submission.student.id,
          nama:
            submission.student.namaLengkap ||
            submission.student.user?.nama ||
            "Unknown",
          email: submission.student.user?.email || "",
        },
        assignment: submission.assignment
          ? {
              id: submission.assignment.id,
              judul: submission.assignment.judul,
              deskripsi: submission.assignment.deskripsi,
              waktuMulai: submission.assignment.waktuMulai,
              waktuSelesai: submission.assignment.waktuSelesai,
              classSubjectTutor: submission.assignment.classSubjectTutor,
            }
          : null,
        quiz: submission.quiz
          ? {
              id: submission.quiz.id,
              judul: submission.quiz.judul,
              deskripsi: submission.quiz.deskripsi,
              waktuMulai: submission.quiz.waktuMulai,
              waktuSelesai: submission.quiz.waktuSelesai,
              classSubjectTutor: submission.quiz.classSubjectTutor,
            }
          : null,
        answers: submission.answers.map((ans) => ({
          id: ans.id,
          jawaban: ans.jawaban,
          isCorrect: ans.isCorrect,
          question: {
            id: ans.question.id,
            teks: ans.question.teks,
            jenis: ans.question.jenis,
          },
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissionId = params.id;
    const body = await req.json();
    const { nilai, feedback } = body;

    if (nilai == null) {
      return NextResponse.json(
        { success: false, message: "Nilai wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        nilai: Number(nilai),
        feedback: feedback || null,
        status: "GRADED",
        waktuDinilai: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
