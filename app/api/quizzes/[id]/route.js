import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const quizId = params.id;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
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
        questions: true, // optional: kalau kamu ingin tampilkan jumlah soal
      },
    });

    if (!quiz) {
      return new Response(
        JSON.stringify({ success: false, message: "Kuis tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: quiz }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET quiz detail:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail kuis" }),
      { status: 500 }
    );
  }
}
