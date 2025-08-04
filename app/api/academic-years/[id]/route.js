import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/academic-years/:id
export async function GET(req, context) {
  const { id } = context.params;

  try {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
    });

    if (!academicYear) {
      return NextResponse.json(
        { success: false, message: "Tahun ajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: academicYear });
  } catch (error) {
    console.error("Gagal mengambil data tahun ajaran:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan", error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/academic-years/:id
export async function PATCH(req, context) {
  const { id } = context.params;

  try {
    const body = await req.json();
    const { tahunMulai, tahunSelesai } = body;

    if (!tahunMulai || !tahunSelesai) {
      return NextResponse.json(
        { success: false, message: "Tahun mulai dan selesai wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: {
        tahunMulai: Number(tahunMulai),
        tahunSelesai: Number(tahunSelesai),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tahun ajaran berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("Gagal update tahun ajaran:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan", error: error.message },
      { status: 500 }
    );
  }
}
