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
// app/api/tutor/quizzes/route.ts

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");

    // Cari tahun ajaran aktif jika tidak ada filter
    const activeYear = academicYearId
      ? { id: academicYearId }
      : await prisma.academicYear.findFirst({ where: { isActive: true } });

    if (!activeYear) {
      return NextResponse.json(
        { message: "Tahun ajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutor: {
          tutorId: tutor.id,
          class: {
            academicYearId: activeYear.id,
          },
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
      {
        success: false,
        message: "Gagal mengambil data quiz",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ========== POST: Simpan kuis baru ==========
export async function POST(req) {
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

    // Validasi waktu
    const startTime = new Date(waktuMulai);
    const endTime = new Date(waktuSelesai);

    // Cek apakah waktu valid
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { message: "Format waktu tidak valid" },
        { status: 400 }
      );
    }

    // Cek apakah waktu selesai lebih besar dari waktu mulai
    if (endTime <= startTime) {
      return NextResponse.json(
        { message: "Waktu selesai harus setelah waktu mulai" },
        { status: 400 }
      );
    }

    // Cek apakah waktu tidak di masa lalu
    const now = new Date();
    if (startTime < now) {
      return NextResponse.json(
        { message: "Waktu mulai tidak boleh di masa lalu" },
        { status: 400 }
      );
    }

    // Validasi akses tutor
    const isOwned = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
      include: {
        class: {
          include: {
            students: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
        subject: true,
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
        waktuMulai: startTime,
        waktuSelesai: endTime,
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

    // Kirim notifikasi ke semua siswa yang ada di class tersebut
    const students = isOwned.class.students;

    if (students.length > 0) {
      const notifikasi = students.map((s) => ({
        senderId: user.id,
        receiverId: s.userId,
        title: `Kuis Baru: ${judul}`,
        message: `Tutor Anda menambahkan kuis "${judul}" pada mata pelajaran ${isOwned.subject.namaMapel}.`,
        type: "QUIZ",
      }));

      await prisma.notification.createMany({ data: notifikasi });
    }

    return NextResponse.json({
      success: true,
      message: "Kuis berhasil disimpan dan notifikasi dikirim",
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
