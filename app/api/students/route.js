import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const classId = searchParams.get("classId");
    const gender = searchParams.get("jenisKelamin");
    const academicYearId = searchParams.get("academicYearId");

    const skip = (page - 1) * limit;

    const filter = {
      ...(classId && { classId }),
      ...(gender && { jenisKelamin: gender }),
      ...(search && {
        OR: [
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
        ],
      }),
    };

    // ⛳️ Tambahkan filter ini HANYA jika academicYearId disediakan
    if (academicYearId) {
      filter.OR = [
        {
          class: {
            academicYearId: academicYearId,
          },
        },
        {
          StudentClassHistory: {
            some: {
              academicYearId: academicYearId,
            },
          },
        },
      ];
    }
    

    // Relasi ke class.academicYearId
    // if (academicYearId) {
    //   filter.class = {
    //     academicYearId: academicYearId,
    //   };
    // }

    if (classId) {
      filter.classId = classId;
    }

    if (gender) {
      filter.jenisKelamin = gender;
    }

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
              academicYear: {
                select: {
                  id: true,
                  tahunMulai: true,
                  tahunSelesai: true,
                  isActive: true,
                },
              },
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

    const {
      userId,
      namaLengkap,
      nisn,
      noTelepon,
      nis,
      jenisKelamin,
      tempatLahir,
      tanggalLahir,
      alamat,
      classId,
    } = data;

    // Validasi awal
    if (
      !userId ||
      !namaLengkap?.trim() ||
      !nisn?.trim() ||
      !nis?.trim() ||
      !noTelepon?.trim() ||
      !jenisKelamin ||
      !tempatLahir?.trim() ||
      !tanggalLahir ||
      !alamat?.trim()
    ) {
      return new Response(
        JSON.stringify({ success: false, message: "Semua field wajib diisi" }),
        { status: 400 }
      );
    }

    // Cek apakah user sudah punya profil siswa
    const existingStudent = await prisma.student.findUnique({
      where: { userId },
    });

    if (existingStudent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Akun ini sudah memiliki profil siswa",
        }),
        { status: 409 }
      );
    }

    // Buat data siswa
    const newStudent = await prisma.student.create({
      data: {
        userId,
        namaLengkap: namaLengkap.trim(),
        nisn: nisn.trim(),
        jenisKelamin,
        noTelepon: noTelepon.trim(),
        nis: nis.trim(),
        tempatLahir: tempatLahir.trim(),
        tanggalLahir: new Date(tanggalLahir),
        alamat: alamat.trim(),
        classId: classId || null,
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data siswa berhasil ditambahkan",
        data: newStudent,
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
