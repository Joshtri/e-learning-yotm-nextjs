import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const quizId = params.id;
  const studentId = params.studentId;

  if (!quizId || !studentId) {
    return NextResponse.json(
      { message: "quizId atau studentId tidak valid" },
      { status: 400 }
    );
  }

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        quizId,
        studentId,
      },
    });

    if (!submission) {
      return NextResponse.json([]);
    }

    const answers = await prisma.answer.findMany({
      where: {
        submissionId: submission.id,
      },
      include: {
        question: true,
      },
    });

    const result = answers.map((item) => ({
      soal: item.question.teks,
      jawaban: item.jawaban,
      benar: item.adalahBenar,
      nilai: item.nilai,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal mengambil jawaban siswa:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan", detail: error.message },
      { status: 500 }
    );
  }
}
