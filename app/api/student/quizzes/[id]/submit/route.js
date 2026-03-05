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
        { status: 401 },
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
        { status: 404 },
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

    // Cek submission untuk attempt information
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        quizId: id,
        studentId: student.id,
      },
      select: {
        attemptCount: true,
        highestScore: true,
        nilai: true,
      },
    });

    const attemptInfo = {
      attemptCount: existingSubmission?.attemptCount || 0,
      highestScore: existingSubmission?.highestScore || null,
      remainingAttempts: Math.max(
        0,
        3 - (existingSubmission?.attemptCount || 0),
      ),
      canAttempt:
        (existingSubmission?.attemptCount || 0) < 3 &&
        (existingSubmission?.highestScore || 0) < (quiz.nilaiMaksimal || 75),
    };

    return NextResponse.json({
      success: true,
      data: quiz,
      attemptInfo,
    });
  } catch (err) {
    console.error("Gagal ambil detail kuis:", err);
    return new Response(
      JSON.stringify({ message: "Gagal memuat detail kuis" }),
      { status: 500 },
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

    // Cari submission yang sudah ada untuk quiz ini
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        quizId,
        studentId,
      },
      include: {
        answers: true,
      },
    });

    const quizData = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { nilaiMaksimal: true },
    });
    const kkm = quizData?.nilaiMaksimal || 75;

    // Hitung attempt count
    const currentAttemptCount = existingSubmission?.attemptCount || 0;
    const currentHighestScore = existingSubmission?.highestScore || 0;

    // Cek batasan percobaan
    if (currentAttemptCount >= 3) {
      return new Response(
        JSON.stringify({
          message: "Batas kesempatan pengerjaan (3x) telah habis.",
          highestScore: currentHighestScore,
          kkm,
        }),
        { status: 400 },
      );
    }

    // Cek jika sudah lulus KKM
    if (currentHighestScore >= kkm) {
      return new Response(
        JSON.stringify({
          message: "Anda sudah lulus KKM pada kuis ini.",
          highestScore: currentHighestScore,
          kkm,
        }),
        { status: 400 },
      );
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      include: { options: true },
    });

    let totalNilai = 0;
    const newAnswers = [];

    // Hitung nilai dari jawaban yang baru
    for (const q of questions) {
      const jawabanSiswa = answers[q.id];
      const imageSiswa = answerImages[q.id];

      let benar = false;
      let nilai = 0;

      if (q.jenis === "ESSAY") {
        benar = null;
        nilai = 0;
      } else {
        const opsiBenar = q.options.find(
          (opt, i) =>
            String(i) === q.jawabanBenar || opt.kode === q.jawabanBenar,
        );

        if (opsiBenar) {
          benar =
            jawabanSiswa?.trim().toLowerCase() ===
              opsiBenar.teks?.trim().toLowerCase() ||
            jawabanSiswa?.trim().toLowerCase() ===
              opsiBenar.kode?.trim().toLowerCase();
        }

        nilai = benar ? q.poin : 0;
      }

      totalNilai += nilai;

      newAnswers.push({
        questionId: q.id,
        jawaban: jawabanSiswa,
        image: imageSiswa || null,
        adalahBenar: benar,
        nilai,
      });
    }

    // Update attempt count
    const newAttemptCount = currentAttemptCount + 1;
    const newHighestScore = Math.max(currentHighestScore, totalNilai);
    const shouldSaveAnswers = totalNilai >= currentHighestScore; // Simpan jawaban jika nilai baru lebih tinggi

    let submission;

    if (existingSubmission) {
      // Update submission yang sudah ada
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          attemptCount: newAttemptCount,
          highestScore: newHighestScore,
          nilai: newHighestScore, // Nilai di submission selalu yang tertinggi
          waktuKumpul,
          waktuDinilai: new Date(),
          status: "GRADED",
        },
      });

      // Jika nilai baru lebih tinggi, hapus jawaban lama dan simpan yang baru
      if (shouldSaveAnswers) {
        // Hapus jawaban lama
        await prisma.answer.deleteMany({
          where: { submissionId: submission.id },
        });

        // Simpan jawaban baru
        for (const answerData of newAnswers) {
          await prisma.answer.create({
            data: {
              submissionId: submission.id,
              ...answerData,
            },
          });
        }
      }
    } else {
      // Buat submission baru (percobaan pertama)
      submission = await prisma.submission.create({
        data: {
          studentId,
          quizId,
          status: "GRADED",
          waktuMulai: waktuKumpul,
          waktuKumpul,
          nilai: totalNilai,
          waktuDinilai: new Date(),
          attemptCount: 1,
          highestScore: totalNilai,
        },
      });

      // Simpan semua jawaban
      for (const answerData of newAnswers) {
        await prisma.answer.create({
          data: {
            submissionId: submission.id,
            ...answerData,
          },
        });
      }
    }

    // Hitung status lulus KKM berdasarkan highest score
    const passedKKM = newHighestScore >= kkm;
    const remainingAttempts = 3 - newAttemptCount;

    let message = "";

    if (passedKKM) {
      if (totalNilai >= kkm) {
        message = `Selamat! Anda lulus dengan nilai ${totalNilai}. KKM: ${kkm}`;
      } else {
        message = `Nilai percobaan ini: ${totalNilai}. Anda sudah lulus dengan nilai tertinggi ${newHighestScore}. KKM: ${kkm}`;
      }
    } else {
      if (remainingAttempts > 0) {
        if (totalNilai > currentHighestScore) {
          message = `Nilai percobaan ${newAttemptCount}: ${totalNilai} (tertinggi baru). Belum mencapai KKM (${kkm}). Sisa ${remainingAttempts} kesempatan.`;
        } else {
          message = `Nilai percobaan ${newAttemptCount}: ${totalNilai}. Nilai tertinggi tetap ${newHighestScore}. Belum mencapai KKM (${kkm}). Sisa ${remainingAttempts} kesempatan.`;
        }
      } else {
        message = `Nilai percobaan ${newAttemptCount}: ${totalNilai}. Nilai tertinggi Anda: ${newHighestScore}. Belum mencapai KKM (${kkm}). Kesempatan telah habis.`;
      }
    }

    return NextResponse.json({
      success: true,
      message,
      currentScore: totalNilai,
      highestScore: newHighestScore,
      kkm,
      passedKKM,
      attemptNumber: newAttemptCount,
      remainingAttempts: Math.max(0, remainingAttempts),
      scoreSaved: shouldSaveAnswers, // Indikator apakah jawaban disimpan
    });
  } catch (error) {
    console.error("Gagal auto-grading:", error);
    return new Response(
      JSON.stringify({ message: "Gagal memproses penilaian kuis" }),
      { status: 500 },
    );
  }
}
