import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { id: assignmentId } = params;

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

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: true,
      },
    });

    if (!assignment || assignment.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke ujian ini" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { questions = [] } = body;

    if (!questions.length) {
      return NextResponse.json(
        { success: false, message: "Data soal tidak valid" },
        { status: 400 }
      );
    }

    const totalPoin = 100;

    const autoGradedQuestions = questions.filter((q) =>
      ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis)
    );

    const poinPerQuestion =
      autoGradedQuestions.length > 0
        ? Math.floor(totalPoin / autoGradedQuestions.length)
        : 0;

    for (const q of questions) {
      const isAutoGraded = ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis);

      const createdQuestion = await prisma.question.create({
        data: {
          assignmentId,
          teks: q.teks,
          jenis: q.jenis,
          poin: isAutoGraded ? poinPerQuestion : 0,
          jawabanBenar: isAutoGraded ? q.jawabanBenar || null : null,
          pembahasan: q.pembahasan || null,
        },
      });

      if (isAutoGraded && q.options?.length) {
        await prisma.answerOption.createMany({
          data: q.options.map((opt, i) => ({
            questionId: createdQuestion.id,
            teks: opt.teks,
            kode: `OPSI_${i}`,
            adalahBenar: String(i) === q.jawabanBenar,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Soal berhasil ditambahkan ke ujian",
    });
  } catch (error) {
    console.error("Gagal menambahkan soal ke ujian:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
