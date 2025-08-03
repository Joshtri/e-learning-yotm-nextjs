import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
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

    const assignmentId = params.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
            tutor: { include: { user: true } },
          },
        },
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = {
      id: assignment.id,
      judul: assignment.judul,
      deskripsi: assignment.deskripsi,
      subject: assignment.classSubjectTutor.subject.namaMapel,
      class: assignment.classSubjectTutor.class.namaKelas,
      tutor: assignment.classSubjectTutor.tutor.user.nama,
      waktuMulai: assignment.waktuMulai,
      waktuSelesai: assignment.waktuSelesai,
      questions: assignment.questions.map((q) => ({
        id: q.id,
        teks: q.teks,
        options: q.options.map((opt) => ({
          id: opt.id,
          teks: opt.teks,
          kode: opt.kode,
        })),
      })),
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Gagal mengambil data soal tugas:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil soal tugas",
      },
      { status: 500 }
    );
  }
}
