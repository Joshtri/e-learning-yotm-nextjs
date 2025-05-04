// File: app/api/admin/holidays/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET: Ambil semua HolidayRange
export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const holidays = await prisma.holidayRange.findMany({
      orderBy: { tanggalMulai: "asc" },
    });

    return NextResponse.json({ success: true, data: holidays });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to load holidays." },
      { status: 500 }
    );
  }
}

// POST: Tambah libur baru
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { nama, tanggalMulai, tanggalSelesai } = await req.json();

    if (!nama || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const holiday = await prisma.holidayRange.create({
      data: {
        nama,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
      },
    });

    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan libur." },
      { status: 500 }
    );
  }
}

// DELETE: Hapus libur berdasarkan ID (gunakan /admin/holidays?id=xxx)
export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 }
      );
    }

    await prisma.holidayRange.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Libur berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus libur." },
      { status: 500 }
    );
  }
}
