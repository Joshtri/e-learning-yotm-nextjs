import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.assignment.findMany({
      where: {
        jenis: {
          in: ["MIDTERM", "FINAL_EXAM"],
        },
      },
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

    return new Response(JSON.stringify({ success: true, data: exams }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET exams:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat ujian" }),
      { status: 500 }
    );
  }
}
