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

    const [currentYear, nextYear] = await prisma.academicYear.findMany({
      where: { isActive: true },
      orderBy: { tahunMulai: "asc" }, // [lama, baru]
      take: 2,
    });

    if (!currentYear || !nextYear) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun ajaran tidak ditemukan",
        }),
        { status: 400 }
      );
    }

    const currentClasses = await prisma.class.findMany({
      where: { academicYearId: currentYear.id },
    });

    const newClasses = currentClasses.map((cls) => {
      const angka = parseInt(cls.namaKelas.replace(/\D/g, ""), 10) || 0;
      return {
        namaKelas: `Kelas ${angka + 1}`,
        programId: cls.programId,
        academicYearId: nextYear.id,
      };
    });

    await prisma.class.createMany({ data: newClasses });

    return new Response(
      JSON.stringify({
        success: true,
        message: `✅ Berhasil menggandakan ${newClasses.length} kelas ke tahun ajaran ${nextYear.tahunMulai}/${nextYear.tahunSelesai}`,
        data: newClasses,
      }),
      { status: 201 }
    );
  } catch (err) {
    console.error("[ERROR DUPLICATE CLASSES]", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      }),
      {
        status: 500,
      }
    );
  }
}
