import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

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
    const { answers } = await req.json(); // answers: [{ questionId, jawaban }]

    if (!assignmentId || !Array.isArray(answers) || answers.length === 0) {
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

    // Simpan semua jawaban
    const createdAnswers = await prisma.$transaction(
      answers.map((ans) =>
        prisma.answer.create({
          data: {
            submissionId: submission.id,
            questionId: ans.questionId,
            jawaban: ans.jawaban,
          },
        })
      )
    );

    // Hitung status apakah terlambat
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    const isLate = new Date() > new Date(assignment.waktuSelesai);

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
    console.error("Gagal submit jawaban:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
