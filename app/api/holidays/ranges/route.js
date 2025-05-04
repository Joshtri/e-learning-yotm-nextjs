import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const ranges = await prisma.holidayRange.findMany({
      orderBy: { startDate: "asc" },
    });
    return NextResponse.json({ success: true, data: ranges });
  } catch (error) {
    console.error("GET /api/holidays/ranges error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data libur" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { nama, tanggalMulai, tanggalSelesai } = body;

    if (!nama || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      });
      
      const created = await prisma.holidayRange.create({
        data: {
          nama,
          startDate: new Date(tanggalMulai),
          endDate: new Date(tanggalSelesai),
          academicYearId: activeYear?.id ?? null,
        },
      })

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("POST /api/holidays/ranges error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan data libur" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID wajib disertakan" },
        { status: 400 }
      );
    }

    await prisma.holidayRange.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("DELETE /api/holidays/ranges error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus data libur" },
      { status: 500 }
    );
  }
}