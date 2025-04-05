import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

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

    const materials = await prisma.learningMaterial.findMany({
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
            tutor: {
              select: { namaLengkap: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error("Gagal ambil learning materials:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

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
    const { judul, konten = "", fileUrl = null, classSubjectTutorId } = body;

    if (!judul || !classSubjectTutorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Judul dan kelas-mapel wajib diisi",
        },
        { status: 400 }
      );
    }

    // Pastikan CST milik tutor login
    const valid = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
    });

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki akses ke kelas-mapel ini",
        },
        { status: 403 }
      );
    }

    const created = await prisma.learningMaterial.create({
      data: {
        judul,
        konten,
        fileUrl,
        classSubjectTutorId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Materi berhasil disimpan",
      data: created,
    });
  } catch (error) {
    console.error("Gagal simpan materi:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
