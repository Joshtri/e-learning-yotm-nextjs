import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id: assignmentId } = params;

    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId,
      },
      include: {
        student: {
          include: {
            user: {
              select: { nama: true }, // jika mau ambil dari user
            },
          },
        },
      },
      orderBy: {
        waktuKumpul: "desc",
      },
    });

    const formatted = submissions.map((sub) => ({
      ...sub,
      student: {
        ...sub.student,
        namaLengkap: sub.student.namaLengkap || sub.student.user?.nama || "-",
      },
    }));

    return Response.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Gagal ambil hasil ujian:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat hasil ujian" }),
      { status: 500 }
    );
  }
}
