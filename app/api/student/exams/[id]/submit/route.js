import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Menilai satu soal pilihan ganda / benar-salah.
 * Mendukung data lama (jawabanBenar di Question, kode null pada opsi)
 * maupun data baru (adalahBenar pada AnswerOption, kode tersedia).
 */
function gradeMultipleChoice(q, jawabanSiswa) {
  if (!jawabanSiswa) return { benar: false, nilai: 0 };

  // 1. Cari opsi benar via flag adalahBenar (data baru)
  let opsiBenar = q.options.find((opt) => opt.adalahBenar === true);

  // 2. Fallback: pakai jawabanBenar di level Question (data lama)
  if (!opsiBenar && q.jawabanBenar != null) {
    const jb = String(q.jawabanBenar).trim();
    opsiBenar =
      q.options.find((o) => o.kode?.trim() === jb) ||
      q.options.find((o) => o.kode?.trim() === `OPSI_${jb}`);

    // Jika masih tidak ketemu, coba sebagai indeks numerik
    if (!opsiBenar) {
      const idx = parseInt(jb);
      if (!isNaN(idx) && idx >= 0 && idx < q.options.length) {
        opsiBenar = q.options[idx];
      }
    }
  }

  if (!opsiBenar) return { benar: false, nilai: 0 };

  const studentNorm = String(jawabanSiswa).trim().toLowerCase();
  const poin = q.poin ?? 0;

  // 3. Bandingkan via kode (standar)
  if (opsiBenar.kode) {
    const benar = studentNorm === opsiBenar.kode.trim().toLowerCase();
    return { benar, nilai: benar ? poin : 0 };
  }

  // 4. Fallback: kode null → bandingkan via posisi indeks (OPSI_N)
  const correctIdx = q.options.indexOf(opsiBenar);
  const studentIdx = parseInt(studentNorm.replace("opsi_", ""));
  const benar = !isNaN(studentIdx) && studentIdx === correctIdx;
  return { benar, nilai: benar ? poin : 0 };
}

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

    const assignment = await prisma.assignment.findUnique({
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

    if (!assignment) {
      return new Response(
        JSON.stringify({ message: "Ujian tidak ditemukan" }),
        {
          status: 404,
        }
      );
    }

    if (!allowedCstIds.includes(assignment.classSubjectTutorId)) {
      return new Response(JSON.stringify({ message: "Unauthorized access" }), {
        status: 403,
      });
    }

    return NextResponse.json({ success: true, data: assignment });
  } catch (err) {
    console.error("Gagal ambil detail ujian:", err);
    return new Response(
      JSON.stringify({ message: "Gagal memuat detail ujian" }),
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id: assignmentId } = params;

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
        assignmentId,
        studentId,
        status: { in: ["SUBMITTED", "GRADED"] }
      },
      orderBy: { createdAt: "desc" }
    });

    // Ujian (Exams) are strictly 1-attempt only, regardless of score.
    if (submissions.length > 0) {
      return new Response(
        JSON.stringify({ message: "Anda sudah mengerjakan ujian ini dan tidak dapat mengulang." }),
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { assignmentId },
      include: { options: true },
    });

    let totalNilai = 0;

    const submission = await prisma.submission.create({
      data: {
        studentId,
        assignmentId,
        status: "SUBMITTED",
        waktuMulai: waktuKumpul,
        waktuKumpul,
      },
    });

    for (const q of questions) {
      const jawabanSiswa = answers[q.id];
      const imageSiswa = answerImages[q.id];
      let benar = null;
      let nilai = 0;

      if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis)) {
        const result = gradeMultipleChoice(q, jawabanSiswa);
        benar = result.benar;
        nilai = result.nilai;
        totalNilai += nilai;
      }

      await prisma.answer.create({
        data: {
          submissionId: submission.id,
          questionId: q.id,
          jawaban: jawabanSiswa ?? "",
          image: imageSiswa || null,
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
        status: "GRADED", // ✅ Update status to GRADED after auto-grading
      },
    });

    // No KKM checks or remedial opportunities, simple response.
    const message = `Ujian berhasil disubmit. Anda mendapatkan nilai ${totalNilai}.`;

    return NextResponse.json({
      success: true,
      message,
      totalNilai,
    });
  } catch (error) {
    console.error("Gagal auto-grading ujian:", error);
    return new Response(
      JSON.stringify({ message: "Gagal memproses penilaian ujian" }),
      { status: 500 }
    );
  }
}
