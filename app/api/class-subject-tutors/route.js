// /app/api/class-subject-tutors/route.ts
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.classSubjectTutor.findMany({
      include: {
        class: { select: { id: true, namaKelas: true } },
        subject: { select: { id: true, namaMapel: true } },
        tutor: { select: { id: true, namaLengkap: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Gagal GET jadwal:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data" }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { tutorId, classId, subjectId } = await request.json();

    if (!tutorId || !classId || !subjectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Semua field wajib diisi",
        }),
        { status: 400 }
      );
    }

    const exists = await prisma.classSubjectTutor.findFirst({
      where: { tutorId, classId, subjectId },
    });

    if (exists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Jadwal ini sudah terdaftar",
        }),
        { status: 409 }
      );
    }

    const created = await prisma.classSubjectTutor.create({
      data: { tutorId, classId, subjectId },
    });

    return Response.json(
      { success: true, data: created, message: "Jadwal berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal POST jadwal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menyimpan data",
      }),
      { status: 500 }
    );
  }
}
