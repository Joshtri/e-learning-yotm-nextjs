import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.toLowerCase();

    const skip = (page - 1) * limit;

    const where = search
      ? {
          namaPaket: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          namaPaket: "asc",
        },
      }),
      prisma.program.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        programs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data program",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { namaPaket } = body;

    // Validasi
    if (!namaPaket || namaPaket.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nama program wajib diisi" },
        { status: 400 }
      );
    }

    // Cek duplikat
    const existing = await prisma.program.findUnique({
      where: { namaPaket },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Nama program sudah terdaftar" },
        { status: 409 }
      );
    }

    // Simpan program
    const program = await prisma.program.create({
      data: {
        namaPaket: namaPaket.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: program,
        message: "Program berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menyimpan program",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
