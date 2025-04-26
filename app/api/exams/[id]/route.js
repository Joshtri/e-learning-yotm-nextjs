import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const exam = await prisma.assignment.findUnique({
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

    if (!exam) {
      return new Response(
        JSON.stringify({ success: false, message: "Ujian tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: exam }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET exam detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail ujian" }),
      { status: 500 }
    );
  }
}
