import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST() {
  try {
    const user = getUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const currentClasses = await prisma.class.findMany({
      include: {
        program: true,
        academicYear: true,
      },
    });

    const nextAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
      orderBy: { tahunMulai: "desc" },
    });

    if (!nextAcademicYear) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun ajaran baru belum tersedia.",
        }),
        { status: 400 }
      );
    }

    const duplicated = await prisma.$transaction(
      currentClasses.map((cls) => {
        const nextNamaKelas = cls.namaKelas.replace(/\d+/, (n) => +n + 1);

        return prisma.class.create({
          data: {
            namaKelas: nextNamaKelas,
            programId: cls.programId,
            academicYearId: nextAcademicYear.id,
          },
        });
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `✅ Berhasil membuat ${duplicated.length} kelas untuk tahun ajaran ${nextAcademicYear.tahunMulai}/${nextAcademicYear.tahunSelesai}.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR GENERATE CLASS FOR NEW YEAR]", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
