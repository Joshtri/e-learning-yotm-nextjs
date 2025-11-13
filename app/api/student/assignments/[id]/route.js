import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET /api/student/assignments/[id]
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
        submissions: {
          where: {
            studentId: student.id,
          },
        },
        questions: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    const sudahMengerjakan = assignment.submissions.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        judul: assignment.judul,
        deskripsi: assignment.deskripsi,
        jenis: assignment.jenis,
        TanggalMulai: assignment.TanggalMulai,
        TanggalSelesai: assignment.TanggalSelesai,
        batasWaktuMenit: assignment.batasWaktuMenit,
        nilaiMaksimal: assignment.nilaiMaksimal,
        class: assignment.classSubjectTutor.class.namaKelas,
        subject: assignment.classSubjectTutor.subject.namaMapel,
        tutor: assignment.classSubjectTutor.tutor.user.nama,
        sudahMengerjakan,
        jumlahSoal: assignment.questions.length,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil detail tugas:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
