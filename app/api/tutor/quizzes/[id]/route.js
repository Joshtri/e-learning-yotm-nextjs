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
    const user = await getUserFromCookie();
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


export async function PATCH(req, { params }) {
  const { id } = params;

  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!tutor) {
      return NextResponse.json({ success: false, message: "Tutor not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      durasiMenit,
      nilaiMaksimal,
      acakSoal,
      acakJawaban,
    } = body;

    // Check if quiz exists and belongs to tutor
    const existingQuiz = await prisma.quiz.findFirst({
      where: {
        id,
        classSubjectTutor: { tutorId: tutor.id },
      },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { success: false, message: "Kuis tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    // Update quiz
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        classSubjectTutorId,
        waktuMulai: waktuMulai ? new Date(waktuMulai) : undefined,
        waktuSelesai: waktuSelesai ? new Date(waktuSelesai) : undefined,
        durasiMenit,
        nilaiMaksimal,
        acakSoal,
        acakJawaban,
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kuis berhasil diperbarui",
      data: updatedQuiz,
    });
  } catch (error) {
    console.error("Gagal PATCH quiz:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui kuis",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Cari tutor.id dari user.id
    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!tutor) {
      return NextResponse.json({ success: false, message: "Tutor not found" }, { status: 404 });
    }

    // Pastikan kuis milik tutor (via relasi ClassSubjectTutor)
    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        classSubjectTutor: { tutorId: tutor.id },
      },
      select: {
        id: true,
        questions: { select: { id: true } },
        submissions: { select: { id: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: "Kuis tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    const questionIds = quiz.questions.map((q) => q.id);
    const submissionIds = quiz.submissions.map((s) => s.id);

    await prisma.$transaction(async (tx) => {
      // 1) Hapus jawaban (Answer) – terhubung ke Submission dan Question
      //    (hapus by submissionId; dan aman juga kalau ada Answer lepas via questionId)
      if (submissionIds.length > 0) {
        await tx.answer.deleteMany({ where: { submissionId: { in: submissionIds } } });
      }
      if (questionIds.length > 0) {
        await tx.answer.deleteMany({ where: { questionId: { in: questionIds } } });
      }

      // 2) Hapus opsi jawaban (AnswerOption) milik semua question kuis
      if (questionIds.length > 0) {
        await tx.answerOption.deleteMany({ where: { questionId: { in: questionIds } } });
      }

      // 3) Hapus submissions kuis
      await tx.submission.deleteMany({ where: { quizId: quiz.id } });

      // 4) Hapus questions kuis
      await tx.question.deleteMany({ where: { quizId: quiz.id } });

      // 5) Hapus kuis
      await tx.quiz.delete({ where: { id: quiz.id } });
    });

    return NextResponse.json({ success: true, message: "Kuis berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus kuis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus kuis",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}