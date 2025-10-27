import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");

    const materials = await prisma.learningMaterial.findMany({
      where: {
        classSubjectTutor: {
          class: {
            academicYearId: academicYearId || undefined, // jika tidak ada, ambil semua
          },
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              include: {
                academicYear: true,
              },
            },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data: materials });
  } catch (error) {
    console.error("Gagal GET materi:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal memuat data materi",
      }),
      { status: 500 }
    );
  }
}
