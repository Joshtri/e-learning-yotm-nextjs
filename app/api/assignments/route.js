import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      where: {
        jenis: {
          notIn: ["MIDTERM", "FINAL_EXAM"],
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              select: {
                id: true,
                namaKelas: true,
                academicYear: {
                  select: {
                    id: true,
                    tahunMulai: true,
                    tahunSelesai: true,
                    semester: true,
                  }
                }
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
