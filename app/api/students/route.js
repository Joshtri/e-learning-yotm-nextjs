import { createApiResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all students (with pagination and filtering)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const classId = searchParams.get("classId");
    const gender = searchParams.get("jenisKelamin");

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (search) {
      filter.OR = [
        { namaLengkap: { contains: search, mode: "insensitive" } },
        { nisn: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
        { tempatLahir: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { nama: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (classId) {
      filter.classId = classId;
    }

    if (gender) {
      filter.jenisKelamin = gender;
    }

    // Execute query with count
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: filter,
        select: {
          id: true,
          namaLengkap: true,
          nisn: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          alamat: true,
          fotoUrl: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              nama: true,
              email: true,
            },
          },
          class: {
            select: {
              id: true,
              namaKelas: true,
              program: {
                select: {
                  id: true,
                  namaPaket: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where: filter }),
    ]);

    // Return formatted response
    return createApiResponse({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return createApiResponse(null, "Failed to fetch students", 500);
  }
}

// POST - Create new student
// POST - Create new student
export async function POST(request) {
  try {
    const data = await request.json();

    if (
      !data.userId ||
      !data.namaLengkap?.trim() ||
      !data.nisn?.trim() ||
      !data.jenisKelamin ||
      !data.tempatLahir?.trim() ||
      !data.tanggalLahir ||
      !data.alamat?.trim()
    ) {
      return createApiResponse(null, "Semua field wajib diisi", 400);
    }

    const newStudent = await prisma.student.create({
      data: {
        userId: data.userId,
        namaLengkap: data.namaLengkap.trim(),
        nisn: data.nisn.trim(),
        jenisKelamin: data.jenisKelamin,
        tempatLahir: data.tempatLahir.trim(),
        tanggalLahir: new Date(data.tanggalLahir),
        alamat: data.alamat.trim(),
        classId: data.classId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
          },
        },
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
          },
        },
      },
    });

    return createApiResponse(
      newStudent,
      "Data siswa berhasil ditambahkan",
      201
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return createApiResponse(null, "Gagal menambahkan data siswa", 500);
  }
}
