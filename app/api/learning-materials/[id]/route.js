import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const material = await prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
      },
    });

    if (!material) {
      return new Response(
        JSON.stringify({ success: false, message: "Materi tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: material }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET materi detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail materi" }),
      { status: 500 }
    );
  }
}
