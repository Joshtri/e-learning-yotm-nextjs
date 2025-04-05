// /app/api/tutor/assignments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutor: {
          tutorId: tutor.id,
        },
        jenis: "EXERCISE",
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

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Gagal memuat data assignments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      batasWaktuMenit,
      nilaiMaksimal,
    } = body;

    if (!judul || !classSubjectTutorId || !waktuMulai || !waktuSelesai) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis: "EXERCISE",
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        batasWaktuMenit,
        nilaiMaksimal,
      },
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Gagal membuat assignment:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id,
      judul,
      deskripsi,
      waktuMulai,
      waktuSelesai,
      batasWaktuMenit,
      nilaiMaksimal,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tugas tidak ditemukan" },
        { status: 400 }
      );
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        judul,
        deskripsi,
        waktuMulai: waktuMulai ? new Date(waktuMulai) : undefined,
        waktuSelesai: waktuSelesai ? new Date(waktuSelesai) : undefined,
        batasWaktuMenit,
        nilaiMaksimal,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Gagal mengupdate assignment:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tugas tidak ditemukan" },
        { status: 400 }
      );
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Tugas berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal menghapus assignment:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
