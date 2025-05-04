import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const academicYearId = searchParams.get("academicYearId");

    const naikKelasRaw = searchParams.get("naikKelas");
    const naikKelas =
      naikKelasRaw === "true"
        ? true
        : naikKelasRaw === "false"
        ? false
        : undefined;

    if (!academicYearId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "academicYearId is required",
        }),
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const filter = {
      academicYearId,
      ...(naikKelas !== undefined && { naikKelas }),
      ...(search && {
        student: {
          OR: [
            { namaLengkap: { contains: search, mode: "insensitive" } },
            { nisn: { contains: search, mode: "insensitive" } },
            {
              user: {
                OR: [
                  { nama: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
      }),
    };

    const [histories, total] = await Promise.all([
      prisma.studentClassHistory.findMany({
        where: filter,
        include: {
          student: {
            select: {
              id: true,
              namaLengkap: true,
              nisn: true,
              user: { select: { nama: true, email: true } },
            },
          },
          class: {
            select: {
              id: true,
              namaKelas: true,
              program: { select: { namaPaket: true } },
            },
          },
          academicYear: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      prisma.studentClassHistory.count({ where: filter }),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          histories,
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
    console.error("Error fetching student history:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
