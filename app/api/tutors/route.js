import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search")?.toLowerCase();

    const skip = (page - 1) * limit;

    // Build filter
    const where = search
      ? {
          OR: [
            {
              namaLengkap: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              telepon: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              user: {
                OR: [
                  {
                    nama: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          ],
        }
      : {};

    const [tutors, total] = await Promise.all([
      prisma.tutor.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
        },
      }),
      prisma.tutor.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tutors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data tutor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST - Create new tutor
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, namaLengkap, telepon, pendidikan, pengalaman, bio } = body;

    if (!userId || !namaLengkap) {
      return NextResponse.json(
        { success: false, message: "User ID dan nama lengkap wajib diisi" },
        { status: 400 }
      );
    }

    // Cek apakah user sudah punya profil tutor
    const existingTutor = await prisma.tutor.findUnique({
      where: { userId },
    });

    if (existingTutor) {
      return NextResponse.json(
        { success: false, message: "User ini sudah memiliki profil tutor" },
        { status: 409 }
      );
    }

    const newTutor = await prisma.tutor.create({
      data: {
        userId,
        namaLengkap: namaLengkap.trim(),
        telepon: telepon?.trim() || null,
        pendidikan: pendidikan?.trim() || null,
        pengalaman: pengalaman?.trim() || null,
        bio: bio?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tutor berhasil ditambahkan",
        data: newTutor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal menambahkan tutor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat menambahkan tutor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
