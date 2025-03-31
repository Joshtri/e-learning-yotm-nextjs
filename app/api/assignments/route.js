// /app/api/assignments/route.js
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
      },
      orderBy: { tersediaDari: "desc" },
    });

    return new Response(JSON.stringify({ success: true, data: assignments }), {
      status: 200,
    });
  } catch (error) {
    console.error("Gagal GET assignments:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat tugas" }),
      {
        status: 500,
      }
    );
  }
}
