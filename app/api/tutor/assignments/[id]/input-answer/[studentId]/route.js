// File: app/api/tutor/assignments/[id]/submissions/[studentId]/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET: Ambil detail assignment dan student untuk edit jawaban
export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: assignmentId, studentId } = params;

    // Cek assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
          },
        },
        questions: {
          include: {
            options: true,
          },
          // orderBy: {
          
          //   // createdAt: "asc",
          // },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada submission
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        student,
        submission,
      },
    });
  } catch (error) {
    console.error("Error fetching assignment detail:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PUT: Update atau create submission dan answers
export async function PUT(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: assignmentId, studentId } = params;
    const body = await req.json();
    const { answers, answerPdf, nilai, feedback } = body;

    console.log("[PUT] Received payload:", { answers: answers?.length, nilai, feedback });

    // Validasi assignment dan student
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        questions: {
          include: {
            options: true,
          },
          // orderBy: {
          //   createdAt: "asc",
          // },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah sudah ada submission
    let submission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
      },
    });

    const now = new Date();

    // Nilai manual dari tutor (jika ada)
    const nilaiManual = nilai !== null && nilai !== undefined ? parseFloat(nilai) : null;

    // Jika belum ada submission, buat baru
    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          studentId,
          assignmentId,
          status: nilaiManual !== null ? "GRADED" : "SUBMITTED",
          waktuMulai: now,
          waktuKumpul: now,
          answerPdf: answerPdf || null,
          nilai: nilaiManual,
          feedback: feedback || null,
          waktuDinilai: nilaiManual !== null ? now : null,
        },
      });
    } else {
      // Update submission yang sudah ada
      submission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: nilaiManual !== null ? "GRADED" : "SUBMITTED",
          waktuKumpul: now,
          answerPdf: answerPdf || submission.answerPdf,
          nilai: nilaiManual !== null ? nilaiManual : submission.nilai,
          feedback: feedback !== null ? feedback : submission.feedback,
          waktuDinilai: nilaiManual !== null ? now : submission.waktuDinilai,
        },
      });
    }

    // Jika ada answers array (untuk soal pilihan ganda, essay, dll)
    if (answers && Array.isArray(answers)) {
      // Hapus jawaban lama
      await prisma.answer.deleteMany({
        where: {
          submissionId: submission.id,
        },
      });

      // Buat jawaban baru
      const answerData = answers.map((ans) => {
        const question = assignment.questions.find((q) => q.id === ans.questionId);
        let adalahBenar = null;
        let nilaiAnswer = null;

        // Auto-grading untuk pilihan ganda dan true/false
        if (question && (question.jenis === "MULTIPLE_CHOICE" || question.jenis === "TRUE_FALSE")) {
          adalahBenar = ans.jawaban === question.jawabanBenar;
          nilaiAnswer = adalahBenar ? question.poin : 0;
        }

        return {
          submissionId: submission.id,
          questionId: ans.questionId,
          jawaban: ans.jawaban,
          adalahBenar,
          nilai: nilaiAnswer,
          feedback: ans.feedback || null,
        };
      });

      await prisma.answer.createMany({
        data: answerData,
      });

      // Hitung total nilai otomatis HANYA jika tutor TIDAK memasukkan nilai manual
      if (nilaiManual === null) {
        const totalNilai = answerData.reduce((sum, ans) => sum + (ans.nilai || 0), 0);
        const maxPoin = assignment.questions.reduce((sum, q) => sum + q.poin, 0);

        if (assignment.nilaiMaksimal && maxPoin > 0) {
          const nilaiAkhir = (totalNilai / maxPoin) * assignment.nilaiMaksimal;

          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              nilai: nilaiAkhir,
              status: "GRADED",
              waktuDinilai: now,
            },
          });

          console.log("[AUTO-GRADE] Calculated nilai:", nilaiAkhir);
        }
      } else {
        console.log("[MANUAL] Using manual nilai:", nilaiManual);
      }
    }

    // Ambil submission terbaru untuk memastikan nilai sudah terupdate
    const updatedSubmission = await prisma.submission.findUnique({
      where: { id: submission.id },
      select: {
        id: true,
        nilai: true,
        status: true,
        waktuDinilai: true,
      },
    });

    console.log("[PUT] Final submission:", updatedSubmission);

    return NextResponse.json({
      success: true,
      message: "Jawaban berhasil disimpan",
      data: {
        submissionId: submission.id,
        nilai: updatedSubmission.nilai,
        status: updatedSubmission.status,
      },
    });
  } catch (error) {
    console.error("Error saving submission:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan jawaban", error: error.message },
      { status: 500 }
    );
  }
}
