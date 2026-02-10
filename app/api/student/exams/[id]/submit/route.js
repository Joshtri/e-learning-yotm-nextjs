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

    const assignmentData = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { nilaiMaksimal: true } // This acts as KKM
    });
    const kkm = assignmentData?.nilaiMaksimal || 75;

    // Logic Remedial
    if (submissions.length > 0) {
      const latestSubmission = submissions[0];

      if (latestSubmission.nilai >= kkm) {
        return new Response(
          JSON.stringify({ message: "Anda sudah lulus KKM pada ujian ini." }),
          { status: 400 }
        );
      }

      // Max 3x attempts logic
      if (submissions.length >= 3) {
        return new Response(
          JSON.stringify({ message: "Batas kesempatan remedial (3x) telah habis." }),
          { status: 400 }
        );
      }
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
        // Find the option that student selected (by kode or teks)
        const opsiDipilih = q.options.find(
          (opt) =>
            opt.kode === jawabanSiswa ||
            opt.teks === jawabanSiswa ||
            opt.teks?.trim().toLowerCase() === jawabanSiswa?.trim().toLowerCase()
        );

        // Check if the selected option is the correct one
        if (opsiDipilih) {
          benar = opsiDipilih.adalahBenar === true;
          nilai = benar ? q.poin : 0;
          totalNilai += nilai;
        } else {
          // Student didn't select a valid option
          benar = false;
          nilai = 0;
        }
      }

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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil disubmit",
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
