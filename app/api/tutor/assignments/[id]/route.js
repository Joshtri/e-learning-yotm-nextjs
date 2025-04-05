import prisma from "@/lib/prisma";

export async function GET(req, context) {
  const { id } = context.params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
      },
    });

    if (!assignment) {
      return new Response(
        JSON.stringify({ success: false, message: "Tugas tidak ditemukan" }),
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify({ success: true, data: assignment }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET assignment detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data tugas" }),
      {
        status: 500,
      }
    );
  }
}
