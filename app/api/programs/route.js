import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;
    const search = searchParams.get("search")?.toLowerCase();

    const skip = (page - 1) * (limit > 0 ? limit : 0);

    const where = search
      ? {
        namaPaket: {
          contains: search,
          mode: "insensitive",
        },
      }
      : {};

    const queryOptions = {
      where,
      orderBy: {
        namaPaket: "asc",
      },
    };

    if (limit > 0) {
      queryOptions.skip = skip;
      queryOptions.take = limit;
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany(queryOptions),
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

    // Cek duplikat (Case-insensitive)
    const existing = await prisma.program.findFirst({
      where: {
        namaPaket: {
          equals: namaPaket,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Program paket ini sudah ada" },
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
