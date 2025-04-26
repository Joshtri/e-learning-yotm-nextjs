// /app/api/learning-materials/route.ts
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const materials = await prisma.learningMaterial.findMany({
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } }, // <= perbaikan disini
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