import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"


export async function DELETE(request, { params }) {
  const { id } = params; // id dari path

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID mata pelajaran tidak ditemukan" },
      { status: 400 }
    );
  }

  try {
    const subject = await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Mata pelajaran berhasil dihapus",
      data: subject,
    });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus mata pelajaran" },
      { status: 500 }
    );
  }
}
