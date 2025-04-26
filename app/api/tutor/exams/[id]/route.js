import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// DELETE – Hapus ujian berdasarkan ID (hanya jika milik tutor yang login)
export async function DELETE(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const examId = params.id;

    // Cek apakah ujian ini milik tutor
    const exam = await prisma.assignment.findFirst({
      where: {
        id: examId,
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { message: "Ujian tidak ditemukan atau bukan milik Anda" },
        { status: 404 }
      );
    }

    await prisma.assignment.delete({
      where: { id: examId },
    });

    return NextResponse.json({ message: "Ujian berhasil dihapus" });
  } catch (error) {
    console.error("Gagal menghapus ujian:", error);
    return NextResponse.json(
      { message: "Gagal menghapus ujian", error: error.message },
      { status: 500 }
    );
  }
}
