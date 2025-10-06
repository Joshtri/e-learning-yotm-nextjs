import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Cari kelas saat ini yang masih punya siswa aktif
    const currentClass = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        students: {
          some: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        academicYear: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "asc" } },
      ],
    });

    if (!currentClass) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Tidak ada kelas aktif",
      });
    }

    // ✅ Untuk move semester: dari GANJIL ke GENAP (tahun yang sama)
    // Cari semester GENAP dengan tahun yang sama
    const academicYears = await prisma.academicYear.findMany({
      where: {
        semester: "GENAP", // Target harus GENAP
        tahunMulai: currentClass.academicYear.tahunMulai,
        tahunSelesai: currentClass.academicYear.tahunSelesai,
      },
      orderBy: [
        { tahunMulai: "desc" },
        { tahunSelesai: "desc" },
      ],
      select: {
        id: true,
        tahunMulai: true,
        tahunSelesai: true,
        semester: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: academicYears,
    });
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
