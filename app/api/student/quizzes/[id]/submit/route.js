import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(_, { params }) {
  const { id } = params;

  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        class: {
          include: {
            classSubjectTutors: true,
          },
        },
      },
    });

    if (!student || !student.class) {
      return NextResponse.json(
        { success: false, message: "Student or class not found" },
        { status: 404 }
      );
    }

    const allowedCstIds = student.class.classSubjectTutors.map((cst) => cst.id);

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { options: true },
          orderBy: { id: "asc" },
        },
        classSubjectTutor: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!quiz) {
      return new Response(JSON.stringify({ message: "Kuis tidak ditemukan" }), {
        status: 404,
      });
    }

    if (!allowedCstIds.includes(quiz.classSubjectTutorId)) {
      return new Response(JSON.stringify({ message: "Unauthorized access" }), {
        status: 403,
      });
    }

    return NextResponse.json({ success: true, data: quiz });
  } catch (err) {
    console.error("Gagal ambil detail kuis:", err);
    return new Response(
      JSON.stringify({ message: "Gagal memuat detail kuis" }),
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id: quizId } = params;

  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "STUDENT") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    if (!student) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    const body = await req.json();
    const { answers, answerImages = {} } = body;

    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ message: "Jawaban tidak valid" }), {
        status: 400,
      });
    }

    const studentId = student.id;
    const waktuKumpul = new Date();

    const submissions = await prisma.submission.findMany({
      where: {
        quizId,
        studentId,
        status: { in: ["SUBMITTED", "GRADED"] }
      },
      orderBy: { createdAt: "desc" }
    });

    const quizData = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { nilaiMaksimal: true } // This acts as KKM
    });
    const kkm = quizData?.nilaiMaksimal || 75; // Default KKM if missing

    // Logic Remedial
    if (submissions.length > 0) {
      const latestSubmission = submissions[0];

      // Jika sudah lulus KKM
      if (latestSubmission.nilai >= kkm) {
        return new Response(
          JSON.stringify({ message: "Anda sudah lulus KKM pada kuis ini." }),
          { status: 400 }
        );
      }

      // Jika belum lulus, cek batas percobaan (max 3x remedial + 1x fresh = 4 total attempts allowed? Or just 3 attempts total?)
      // User request: "batas pengerjaan adalah 3 kali" (total attempts presumably)
      if (submissions.length >= 3) {
        return new Response(
          JSON.stringify({ message: "Batas kesempatan remedial (3x) telah habis." }),
          { status: 400 }
        );
      }
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      include: { options: true },
    });

    let totalNilai = 0;

    const submission = await prisma.submission.create({
      data: {
        studentId,
        quizId,
        status: "SUBMITTED",
        waktuMulai: waktuKumpul,
        waktuKumpul,
      },
    });

    for (const q of questions) {
      const jawabanSiswa = answers[q.id];
      const imageSiswa = answerImages[q.id];

      let benar = false;
      let nilai = 0;

      if (q.jenis === "ESSAY") {
        // Essay questions rely on manual grading
        benar = null;
        nilai = 0;
      } else {
        const opsiBenar = q.options.find(
          (opt, i) =>
            String(i) === q.jawabanBenar || opt.kode === q.jawabanBenar
        );

        const teksJawabanBenar = opsiBenar?.teks || "";

        benar =
          jawabanSiswa?.trim().toLowerCase() ===
          teksJawabanBenar.trim().toLowerCase();

        nilai = benar ? q.poin : 0;
      }

      totalNilai += nilai;

      await prisma.answer.create({
        data: {
          submissionId: submission.id,
          questionId: q.id,
          jawaban: jawabanSiswa,
          image: imageSiswa || null, // ✅ Simpan gambar jawaban
          adalahBenar: benar,
          nilai,
        },
      });
    }

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        nilai: totalNilai,
        waktuDinilai: new Date(),
        status: "GRADED",
      },
    });

    // Check if student passed KKM
    const passedKKM = totalNilai >= kkm;
    const attemptNumber = submissions.length + 1; // Current attempt
    const remainingAttempts = 3 - attemptNumber;

    let message = "";
    let needsRemedial = false;

    if (passedKKM) {
      message = `Selamat! Anda lulus dengan nilai ${totalNilai}. KKM: ${kkm}`;
    } else {
      needsRemedial = true;
      if (remainingAttempts > 0) {
        message = `Nilai Anda ${totalNilai} belum mencapai KKM (${kkm}). Anda masih memiliki ${remainingAttempts} kesempatan remedial.`;
      } else {
        message = `Nilai Anda ${totalNilai} belum mencapai KKM (${kkm}). Kesempatan remedial Anda telah habis.`;
      }
    }

    return NextResponse.json({
      success: true,
      message,
      totalNilai,
      kkm,
      passedKKM,
      needsRemedial,
      attemptNumber,
      remainingAttempts: Math.max(0, remainingAttempts),
    });
  } catch (error) {
    console.error("Gagal auto-grading:", error);
    return new Response(
      JSON.stringify({ message: "Gagal memproses penilaian kuis" }),
      { status: 500 }
    );
  }
}
