import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET – Ambil detail ujian berdasarkan ID
export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const examId = params.id;

    const exam = await prisma.assignment.findFirst({
      where: {
        id: examId,
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error) {
    console.error("Gagal mengambil detail ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data ujian" },
      { status: 500 }
    );
  }
}

// PUT – Update ujian berdasarkan ID
export async function PUT(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ success: false, message: "Tutor not found" }, { status: 404 });
    }

    const examId = params.id;
    const body = await req.json();
    const {
      judul,
      deskripsi,
      jenis,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      nilaiMaksimal,
      acakSoal,
      acakJawaban,
    } = body;

    // Cek apakah ujian ini milik tutor
    const existingExam = await prisma.assignment.findFirst({
      where: {
        id: examId,
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
    });

    if (!existingExam) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan atau bukan milik Anda" },
        { status: 404 }
      );
    }

    // Update exam
    const updatedExam = await prisma.assignment.update({
      where: { id: examId },
      data: {
        judul,
        deskripsi,
        jenis,
        classSubjectTutorId,
        TanggalMulai: waktuMulai ? new Date(waktuMulai) : undefined,
        TanggalSelesai: waktuSelesai ? new Date(waktuSelesai) : undefined,
        nilaiMaksimal: nilaiMaksimal ? Number(nilaiMaksimal) : undefined,
        acakSoal: acakSoal !== undefined ? acakSoal : undefined,
        acakJawaban: acakJawaban !== undefined ? acakJawaban : undefined,
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil diperbarui",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Gagal memperbarui ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui ujian", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH – Update ujian berdasarkan ID
export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ success: false, message: "Tutor not found" }, { status: 404 });
    }

    const examId = params.id;
    const body = await req.json();
    const {
      judul,
      deskripsi,
      jenis,
      classSubjectTutorId,
      tanggalMulai,
      tanggalSelesai,
      nilaiMaksimal,
    } = body;

    // Cek apakah ujian ini milik tutor
    const existingExam = await prisma.assignment.findFirst({
      where: {
        id: examId,
        classSubjectTutor: {
          tutorId: tutor.id,
        },
      },
    });

    if (!existingExam) {
      return NextResponse.json(
        { success: false, message: "Ujian tidak ditemukan atau bukan milik Anda" },
        { status: 404 }
      );
    }

    // Update exam
    const updatedExam = await prisma.assignment.update({
      where: { id: examId },
      data: {
        judul,
        deskripsi,
        jenis,
        classSubjectTutorId,
        TanggalMulai: tanggalMulai ? new Date(tanggalMulai) : undefined,
        TanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : undefined,
        nilaiMaksimal,
      },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil diperbarui",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Gagal memperbarui ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui ujian", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE – Hapus ujian berdasarkan ID (hanya jika milik tutor yang login)
export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromCookie();
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
