import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// PUT - Update soal
export async function PUT(req, { params }) {
  const { id: questionId } = params;

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

    // Check if question belongs to tutor's assignment
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        assignment: {
          include: {
            classSubjectTutor: true,
          },
        },
      },
    });

    if (
      !question ||
      question.assignment.classSubjectTutor.tutorId !== tutor.id
    ) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke soal ini" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { teks, jenis, poin, pembahasan, jawabanBenar, options } = body;

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        teks,
        jenis,
        poin: poin ? Number(poin) : undefined,
        pembahasan,
        jawabanBenar,
      },
    });

    // Update options if multiple choice
    if (jenis === "MULTIPLE_CHOICE" && options) {
      // Delete existing options
      await prisma.answerOption.deleteMany({
        where: { questionId },
      });

      // Create new options
      if (options.length > 0) {
        await prisma.answerOption.createMany({
          data: options.map((opt, i) => ({
            questionId,
            teks: opt.teks,
            kode: `OPSI_${String.fromCharCode(65 + i)}`,
            adalahBenar: opt.benar || false,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Soal berhasil diperbarui",
      data: updatedQuestion,
    });
  } catch (error) {
    console.error("Gagal memperbarui soal:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus soal
export async function DELETE(req, { params }) {
  const { id: questionId } = params;

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

    // Check if question belongs to tutor's assignment
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        assignment: {
          include: {
            classSubjectTutor: true,
          },
        },
      },
    });

    if (
      !question ||
      question.assignment.classSubjectTutor.tutorId !== tutor.id
    ) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke soal ini" },
        { status: 403 }
      );
    }

    // Delete question (options will be deleted automatically via cascade)
    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      message: "Soal berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal menghapus soal:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
