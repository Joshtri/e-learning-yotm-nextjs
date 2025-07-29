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
