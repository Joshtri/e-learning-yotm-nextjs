import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        classSubjectTutor: {
          include: {
            class: {
              select: {
                id: true, // <== tambahkan ini
                namaKelas: true,
              },
            },
            subject: {
              select: {
                id: true, // <== bisa juga ambil id mapel
                namaMapel: true,
              },
            },
            tutor: {
              select: {
                id: true, // <== bisa juga ambil id tutor
                namaLengkap: true,
              },
            },
          },
        },
      },
      orderBy: {
        TanggalMulai: "desc",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: assignments,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal GET assignments:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal memuat tugas",
      }),
      { status: 500 }
    );
  }
}
