import prisma from "@/lib/prisma";
import { deleteFileFromFirebase, uploadFileToFirebase } from "@/lib/firebase";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";
 
export async function GET(_, { params }) {
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

  try {
    const material = await prisma.learningMaterial.findUnique({
      where: { id: params.id },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!material || material.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    console.error("Gagal fetch detail materi:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
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

  const { id } = params;

  try {
    const formData = await req.formData();
    const judul = formData.get("judul");
    const konten = formData.get("konten") || "";
    const classSubjectTutorId = formData.get("classSubjectTutorId");
    const file = formData.get("file");

    if (!judul || !classSubjectTutorId) {
      return NextResponse.json(
        { success: false, message: "Data wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        classSubjectTutor: true,
      },
    });

    if (!existing || existing.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    let fileUrl = existing.fileUrl;

    if (file && file.name) {
      if (fileUrl) await deleteFileFromFirebase(fileUrl);
      const buffer = Buffer.from(await file.arrayBuffer());
      fileUrl = await uploadFileToFirebase(buffer, file.name, "materials");
    }

    const updated = await prisma.learningMaterial.update({
      where: { id },
      data: {
        judul,
        konten,
        fileUrl,
        classSubjectTutorId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Materi berhasil diperbarui",
    });
  } catch (error) {
    console.error("Gagal update materi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui data" },
      { status: 500 }
    );
  }
}

export async function DELETE(_, { params }) {
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

  const { id } = params;

  try {
    const existing = await prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        classSubjectTutor: true,
      },
    });

    if (!existing || existing.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    // 🔥 Hapus file dari Firebase Storage
    if (existing.fileUrl) {
      await deleteFileFromFirebase(existing.fileUrl);
    }

    await prisma.learningMaterial.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Materi berhasil dihapus",
    });
  } catch (error) {
    console.error("Gagal hapus materi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus materi" },
      { status: 500 }
    );
  }
}
