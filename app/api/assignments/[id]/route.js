import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                namaLengkap: true,
                nisn: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
        questions: true,
      },
    });

    if (!assignment) {
      return new Response(
        JSON.stringify({ success: false, message: "Tugas tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: assignment }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET assignment detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail tugas" }),
      { status: 500 }
    );
  }
}
