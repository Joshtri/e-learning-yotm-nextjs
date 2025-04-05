import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const { id } = params;

  try {
    const user = getUserFromCookie();

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
    const user = getUserFromCookie();
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
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ message: "Jawaban tidak valid" }), {
        status: 400,
      });
    }

    const studentId = student.id;
    const waktuKumpul = new Date();

    const existing = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId,
        status: "SUBMITTED",
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Anda sudah mengerjakan ujian ini." }),
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
      let benar = null;
      let nilai = 0;

      if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis)) {
        const jawabanBenar = q.options.find((opt) => opt.adalahBenar);
        if (jawabanBenar) {
          benar = jawabanSiswa === jawabanBenar.kode;
          nilai = benar ? q.poin : 0;
          totalNilai += nilai;
        }
      }

      await prisma.answer.create({
        data: {
          submissionId: submission.id,
          questionId: q.id,
          jawaban: jawabanSiswa,
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
