import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(_, { params }) {
  const { id: assignmentId } = await params;

  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
        { message: "Siswa atau kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const allowedCstIds = student.class.classSubjectTutors.map((cst) => cst.id);

    const exam = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: {
          include: {
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
            class: { select: { id: true, namaKelas: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { message: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!allowedCstIds.includes(exam.classSubjectTutorId)) {
      return NextResponse.json(
        { message: "Akses tidak diizinkan" },
        { status: 403 }
      );
    }

    const existing = await prisma.submission.findFirst({
      where: {
        studentId: student.id,
        assignmentId,
        status: "SUBMITTED",
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Anda sudah mengerjakan ujian ini." },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { assignmentId },
      include: {
        options: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          judul: exam.judul,
          jenis: exam.jenis,
          waktuMulai: exam.waktuMulai,
          waktuSelesai: exam.waktuSelesai,
          batasWaktuMenit: exam.batasWaktuMenit,
          nilaiMaksimal: exam.nilaiMaksimal,
          class: exam.classSubjectTutor.class,
          subject: exam.classSubjectTutor.subject,
          tutor: exam.classSubjectTutor.tutor,
        },
        questions: questions.map((q) => ({
          id: q.id,
          teks: q.teks,
          jenis: q.jenis,
          options: q.options.map((o) => ({
            id: o.id,
            teks: o.teks,
            kode: o.kode,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Gagal ambil soal ujian:", error);
    return new Response(
      JSON.stringify({ message: "Gagal memuat soal ujian" }),
      { status: 500 }
    );
  }
}
