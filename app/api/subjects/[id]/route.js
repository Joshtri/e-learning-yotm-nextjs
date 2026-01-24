import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/subject/[id]
export async function GET(request, context) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID mata pelajaran tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        program: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data mata pelajaran" },
      { status: 500 }
    );
  }
}

// PATCH /api/subject/[id]
export async function PATCH(request, context) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID mata pelajaran tidak ditemukan" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { namaMapel, kodeMapel, deskripsi, programId } = body;

  try {
    const updated = await prisma.subject.update({
      where: { id },
      data: {
        namaMapel,
        kodeMapel,
        deskripsi,
        programId: programId || null,
      },
      include: {
        program: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui mata pelajaran" },
      { status: 500 }
    );
  }
}

// DELETE /api/subject/[id]
export async function DELETE(request, context) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID mata pelajaran tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    const deleted = await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil dihapus",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus mata pelajaran" },
      { status: 500 }
    );
  }
}
