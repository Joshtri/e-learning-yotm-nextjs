import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  const { id: quizId } = params;

  if (!quizId) {
    return NextResponse.json(
      { message: "quizId tidak valid" },
      { status: 400 }
    );
  }

  try {
    // Ambil quiz untuk dapatkan classId
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: "Quiz tidak ditemukan" },
        { status: 404 }
      );
    }

    const classId = quiz.classSubjectTutor.classId;

    // Ambil semua siswa dari kelas tersebut
    const students = await prisma.student.findMany({
      where: {
        classId,
      },
      include: {
        user: true,
      },
    });

    // Ambil semua submission untuk kuis ini
    const submissions = await prisma.submission.findMany({
      where: { quizId },
      select: {
        studentId: true,
        status: true,
        nilai: true,
      },
    });

    // Buat map studentId -> { status, nilai }
    const submissionMap = new Map(
      submissions.map((s) => [s.studentId, { status: s.status, nilai: s.nilai }])
    );

    // Gabungkan data siswa + status pengerjaan
    const result = students.map((s) => {
      const submission = submissionMap.get(s.id);
      return {
        id: s.id,
        namaLengkap: s.namaLengkap,
        user: {
          email: s.user.email,
        },
        statusPengerjaan: submission?.status || "BELUM_MENGERJAKAN",
        nilai: submission?.nilai ?? null,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
