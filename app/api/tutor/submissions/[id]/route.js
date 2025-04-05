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
        student: {
          id: submission.student.id,
          nama: submission.student.user.nama,
        },
        assignment: {
          id: submission.assignment.id,
          judul: submission.assignment.judul,
          classSubjectTutor: submission.assignment.classSubjectTutor,
        },
        answers: submission.answers.map((ans) => ({
          id: ans.id,
          jawaban: ans.jawaban,
          question: {
            id: ans.question.id,
            teks: ans.question.teks,
            jenis: ans.question.jenis,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Gagal mengambil detail submission:", error);
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
  } catch (error) {
    console.error("Gagal memberikan nilai:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
