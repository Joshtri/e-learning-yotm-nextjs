import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function getUserFromCookie() {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ========== GET: List kuis tutor ==========
export async function GET() {
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

    const quizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    console.error("Gagal ambil data quiz:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data quiz" },
      { status: 500 }
    );
  }
}

// ========== POST: Simpan kuis baru ==========
export async function POST(req) {
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

    const body = await req.json();
    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      durasiMenit,
      nilaiMaksimal,
      acakSoal,
      acakJawaban,
      questions = [],
    } = body;

    if (
      !judul ||
      !classSubjectTutorId ||
      !waktuMulai ||
      !waktuSelesai ||
      !durasiMenit ||
      !nilaiMaksimal
    ) {
      return NextResponse.json(
        { message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi apakah classSubjectTutorId memang milik tutor ini
    const isOwned = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
    });

    if (!isOwned) {
      return NextResponse.json(
        { message: "Anda tidak memiliki akses ke kelas ini" },
        { status: 403 }
      );
    }

    const totalPoin = 100;
    const poinPerQuestion =
      questions.length > 0 ? Math.floor(totalPoin / questions.length) : 1;

    // Simpan kuis
    const quiz = await prisma.quiz.create({
      data: {
        judul,
        deskripsi,
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        durasiMenit: Number(durasiMenit),
        nilaiMaksimal: Number(nilaiMaksimal),
        acakSoal,
        acakJawaban,
      },
    });

    // Simpan soal dan opsi
    for (const q of questions) {
      const createdQuestion = await prisma.question.create({
        data: {
          quizId: quiz.id,
          teks: q.teks,
          jenis: q.jenis,
          poin: Number(q.poin || poinPerQuestion),
          jawabanBenar: q.jawabanBenar || null,
          pembahasan: q.pembahasan || null,
        },
      });

      if (
        ["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(q.jenis) &&
        q.options?.length
      ) {
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
      message: "Kuis berhasil disimpan",
      data: quiz,
    });
  } catch (error) {
    console.error("Gagal menyimpan kuis:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan kuis" },
      { status: 500 }
    );
  }
}
