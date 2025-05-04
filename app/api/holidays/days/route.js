// route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const days = await prisma.holiday.findMany({ orderBy: { tanggal: "asc" } });
    return NextResponse.json({ success: true, data: days });
  } catch (err) {
    console.error("GET /holidays/days error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memuat libur harian" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { tanggal, reason } = await req.json();
    if (!tanggal || !reason) {
      return NextResponse.json(
        { success: false, message: "Field wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.holiday.create({
      data: {
        tanggal: new Date(tanggal),
        reason,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error("POST /holidays/days error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { success: false, message: "ID wajib disertakan" },
        { status: 400 }
      );

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /holidays/days error:", err);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus" },
      { status: 500 }
    );
  }
}
