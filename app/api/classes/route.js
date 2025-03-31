import { createApiResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List semua kelas (dengan program dan tahun ajaran)
export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        program: true,
        academicYear: true,
      },
      orderBy: {
        namaKelas: "asc",
      },
    });

    return createApiResponse({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return createApiResponse(null, "Failed to fetch classes", 500);
  }
}

// POST - Tambah kelas baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { namaKelas, programId, academicYearId } = body;

    if (!namaKelas || !programId || !academicYearId) {
      return createApiResponse(null, "Semua field wajib diisi", 400);
    }

    const existing = await prisma.class.findFirst({
      where: {
        namaKelas,
        programId,
        academicYearId,
      },
    });

    if (existing) {
      return createApiResponse(null, "Kelas dengan kombinasi ini sudah ada", 409);
    }

    const newClass = await prisma.class.create({
      data: {
        namaKelas,
        programId,
        academicYearId,
      },
    });

    return createApiResponse(newClass, null, 201);
  } catch (error) {
    console.error("Error creating class:", error);
    return createApiResponse(null, "Failed to create class", 500);
  }
}
