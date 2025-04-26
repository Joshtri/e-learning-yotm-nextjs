import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const quizzes = await prisma.quiz.findMany({
      where: classId
        ? {
            classSubjectTutor: {
              classId: classId,
            },
          }
        : undefined,
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
      },
      orderBy: {
        waktuMulai: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: quizzes,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal GET quizzes:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal memuat kuis",
      }),
      { status: 500 }
    );
  }
}
