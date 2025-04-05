import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.toLowerCase();

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            {
              tahunMulai: {
                equals: isNaN(Number(search)) ? undefined : Number(search),
              },
            },
            {
              tahunSelesai: {
                equals: isNaN(Number(search)) ? undefined : Number(search),
              },
            },
          ],
        }
      : {};

    const [academicYears, total] = await Promise.all([
      prisma.academicYear.findMany({
        where,
        orderBy: { tahunMulai: "desc" },
        skip,
        take: limit,
      }),
      prisma.academicYear.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: {
        academicYears,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return Response.json(
      {
        success: false,
        message: "Gagal mengambil data tahun ajaran",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


// POST - Tambah tahun ajaran baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { tahunMulai, tahunSelesai } = body;

    // Validasi wajib
    if (!tahunMulai || !tahunSelesai) {
      return NextResponse.json(
        {
          success: false,
          message: "Tahun mulai dan tahun selesai wajib diisi",
        },
        { status: 400 }
      );
    }

    // Validasi tidak boleh duplikat
    const existing = await prisma.academicYear.findFirst({
      where: {
        tahunMulai: parseInt(tahunMulai),
        tahunSelesai: parseInt(tahunSelesai),
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Tahun ajaran sudah ada" },
        { status: 409 }
      );
    }

    const newAcademicYear = await prisma.academicYear.create({
      data: {
        tahunMulai: parseInt(tahunMulai),
        tahunSelesai: parseInt(tahunSelesai),
        isActive: false, // default: tidak aktif
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tahun ajaran berhasil ditambahkan",
        data: newAcademicYear,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal tambah tahun ajaran:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan", error: error.message },
      { status: 500 }
    );
  }
}
