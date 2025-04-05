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
      },
    });

    // Buat map studentId -> status pengerjaan
    const submissionMap = new Map(
      submissions.map((s) => [s.studentId, s.status])
    );

    // Gabungkan data siswa + status pengerjaan
    const result = students.map((s) => ({
      id: s.id,
      namaLengkap: s.namaLengkap,
      user: {
        email: s.user.email,
      },
      statusPengerjaan: submissionMap.get(s.id) || "BELUM_MENGERJAKAN",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal mengambil data siswa:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan", detail: error.message },
      { status: 500 }
    );
  }
}
