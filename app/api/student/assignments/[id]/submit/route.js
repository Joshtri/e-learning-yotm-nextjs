import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const maxDuration = 120;

export async function POST(req, { params }) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignmentId = params.id;
    const { answers, answerPdf } = await req.json(); // answers: [{ questionId, jawaban }] or answerPdf: base64

    if (!assignmentId || (!Array.isArray(answers) && !answerPdf)) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    if (Array.isArray(answers) && answers.length === 0 && !answerPdf) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cari submission yang belum disubmit
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: student.id,
      },
    });

    if (!submission) {
      // Buat submission jika belum ada
      submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: student.id,
          status: "IN_PROGRESS",
          waktuMulai: new Date(),
        },
      });
    }

    // Check if this is a PDF-based assignment and validate date range
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if assignment is within the allowed date range
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (assignment.TanggalSelesai) {
      const endDate = new Date(assignment.TanggalSelesai);
      if (currentDate > endDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Tugas sudah melewati batas waktu pengumpulan.",
            endDate: assignment.TanggalSelesai
          },
          { status: 403 }
        );
      }
    }

    if (assignment.questionsFromPdf && answerPdf) {
      // Handle PDF submission
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          answerPdf: answerPdf,
        },
      });
    } else if (answers && Array.isArray(answers)) {
      // Handle traditional question-based submission
      await prisma.$transaction(
        answers.map((ans) =>
          prisma.answer.create({
            data: {
              submissionId: submission.id,
              questionId: ans.questionId,
              jawaban: ans.jawaban,
              image: ans.image || null, // ✅ Simpan gambar jawaban
            },
          })
        )
      );
    }

    // Hitung status apakah terlambat berdasarkan tanggal selesai
    const isLate = assignment.TanggalSelesai ? currentDate > new Date(assignment.TanggalSelesai) : false;

    // Update submission jadi submitted
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: isLate ? "LATE" : "SUBMITTED",
        waktuKumpul: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Jawaban berhasil dikirim",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
