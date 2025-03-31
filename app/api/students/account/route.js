import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        student: null, // hanya yang belum punya profil student
      },
      select: {
        id: true,
        nama: true,
        email: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { users },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching student accounts:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal mengambil data akun siswa",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
