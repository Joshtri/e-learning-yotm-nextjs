import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search")?.toLowerCase();

    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = limitParam ? parseInt(limitParam) : 0; // 0 berarti ambil semua

    const where = search
      ? {
          namaMapel: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const findOptions = {
      where,
      orderBy: { namaMapel: "asc" },
    };

    // Jika limit > 0, berarti pagination aktif
    if (limit > 0) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany(findOptions),
      prisma.subject.count({ where }),
    ]);

    const response = {
      success: true,
      data: {
        subjects,
      },
    };

    // Sertakan info pagination hanya jika limit > 0
    if (limit > 0) {
      response.data.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      };
    }

    return NextResponse.json(response);
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

export async function POST(request) {
  try {
    const body = await request.json();

    // Ambil & normalisasi
    const rawNamaMapel =
      typeof body?.namaMapel === "string" ? body.namaMapel.trim() : "";
    const rawKodeMapel =
      typeof body?.kodeMapel === "string" ? body.kodeMapel.trim() : undefined;
    const rawDeskripsi =
      typeof body?.deskripsi === "string" ? body.deskripsi.trim() : undefined;

    // Validasi dasar
    if (!rawNamaMapel) {
      return NextResponse.json(
        { success: false, message: "namaMapel wajib diisi." },
        { status: 400 }
      );
    }
    if (rawNamaMapel.length > 100) {
      return NextResponse.json(
        { success: false, message: "namaMapel maksimal 100 karakter." },
        { status: 400 }
      );
    }
    if (rawKodeMapel && rawKodeMapel.length > 20) {
      return NextResponse.json(
        { success: false, message: "kodeMapel maksimal 20 karakter." },
        { status: 400 }
      );
    }

    // Buat payload data (empty string -> null)
    const data = {
      namaMapel: rawNamaMapel,
      kodeMapel: rawKodeMapel ? rawKodeMapel : null,
      deskripsi: rawDeskripsi ? rawDeskripsi : null,
    };

    // Optional pre-check biar bisa balikin 409 yang rapi sebelum kena constraint DB
    const existing = await prisma.subject.findUnique({
      where: { namaMapel: rawNamaMapel },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Nama mata pelajaran sudah terdaftar." },
        { status: 409 }
      );
    }

    const created = await prisma.subject.create({ data });

    return NextResponse.json(
      {
        success: true,
        message: "Mata pelajaran berhasil dibuat.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subject:", error);

    // Tangani unique constraint dari Prisma (fallback kalau pre-check terlewat)
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "Nama mata pelajaran sudah terdaftar.",
          error: error.meta?.target,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Gagal membuat mata pelajaran",
        error: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
