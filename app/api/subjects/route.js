import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List all subjects with optional pagination & search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = searchParams.get("limit");
    let limit = limitParam ? parseInt(limitParam) : 10;
    const search = searchParams.get("search")?.toLowerCase();

    const where = search
      ? {
          namaMapel: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    // Siapkan opsi query prisma
    const findOptions = {
      where,
      orderBy: { namaMapel: "asc" },
    };

    // Jika limit valid (positif), pakai pagination
    if (limit > 0) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
    }
    // Jika limit <= 0, ambil semua data tanpa pagination (skip & take tidak diset)

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany(findOptions),
      prisma.subject.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subjects,
        pagination: {
          page,
          limit,
          total,
          pages: limit > 0 ? Math.ceil(total / limit) : 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat data mata pelajaran",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Tambah subject baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { namaMapel, deskripsi } = body;

    if (!namaMapel?.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama mapel wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.subject.findUnique({
      where: {
        namaMapel,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Nama mapel sudah digunakan" },
        { status: 409 }
      );
    }

    const newSubject = await prisma.subject.create({
      data: {
        namaMapel: namaMapel.trim(),
        deskripsi: deskripsi?.trim() || null,
        kodeMapel: null, // bisa nanti di-generate otomatis
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Mata pelajaran berhasil ditambahkan",
        data: newSubject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan mapel",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
