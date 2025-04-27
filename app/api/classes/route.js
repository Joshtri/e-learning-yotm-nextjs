import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.namaKelas = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          program: true,
          academicYear: true,
          homeroomTeacher: {
            include: {
              user: {
                select: { nama: true },
              },
            },
          },
        },
        orderBy: {
          namaKelas: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.class.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          classes,
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
    console.error("Error fetching classes:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch classes",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { namaKelas, programId, academicYearId } = body;

    if (!namaKelas || !programId || !academicYearId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Semua field wajib diisi",
        }),
        { status: 400 }
      );
    }

    const existing = await prisma.class.findFirst({
      where: {
        namaKelas,
        programId,
        academicYearId,
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kelas dengan kombinasi ini sudah ada",
        }),
        { status: 409 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        namaKelas,
        programId,
        academicYearId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: newClass,
        message: "Kelas berhasil ditambahkan",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to create class",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
