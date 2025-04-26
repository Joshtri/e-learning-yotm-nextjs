import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.assignment.findMany({
      where: {
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST"],
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              select: {
                id: true,
                namaKelas: true,
                academicYearId: true,
              },
            },
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
            tutor: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
      },
      orderBy: {
        waktuMulai: "desc",
      },
    });

    // Format supaya frontend lebih gampang pakai
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      judul: exam.judul,
      jenis: exam.jenis,
      waktuMulai: exam.waktuMulai,
      waktuSelesai: exam.waktuSelesai,
      class: exam.classSubjectTutor.class,
      subject: exam.classSubjectTutor.subject,
      tutor: exam.classSubjectTutor.tutor,
    }));

    return new Response(
      JSON.stringify({ success: true, data: formattedExams }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gagal GET daily exams:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat ujian harian" }),
      { status: 500 }
    );
  }
}
