import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const classId = searchParams.get("classId");
    const gender = searchParams.get("jenisKelamin");

    const skip = (page - 1) * limit;

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

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          students,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching students:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Failed to fetch students" }),
      { status: 500 }
    );
  }
}

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
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi" }),
        { status: 400 }
      );
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

    // Cek apakah userId sudah digunakan
    const existingStudent = await prisma.student.findUnique({
      where: {
        userId: data.userId,
      },
    });

    if (existingStudent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Akun ini sudah memiliki profil siswa",
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: newStudent,
        message: "Data siswa berhasil ditambahkan",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menambahkan data siswa",
        error: error.message,
      }),
      { status: 500 }
    );
}
}
