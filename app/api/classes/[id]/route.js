import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        academicYear: true,
        program: true,
        students: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!classData) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: classData }), {
      status: 200,
    });
  } catch (err) {
    console.error("Gagal memuat detail kelas:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail kelas" }),
      { status: 500 }
    );
  }
}
