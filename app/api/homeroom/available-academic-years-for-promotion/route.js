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
        { academicYear: { semester: "desc" } }, // GENAP dulu
      ],
    });

    if (!currentClass) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Tidak ada kelas aktif",
      });
    }

    // ✅ Validasi: Hanya bisa promote di semester GENAP
    if (currentClass.academicYear.semester !== "GENAP") {
      return NextResponse.json({
        success: false,
        message: "Kenaikan kelas hanya bisa dilakukan di semester GENAP",
        currentSemester: currentClass.academicYear.semester,
      }, { status: 403 });
    }

    // ✅ Untuk promote students: dari GENAP tahun ini → GANJIL tahun depan
    // Cari tahun akademik GANJIL yang lebih besar dari tahun saat ini
    const academicYears = await prisma.academicYear.findMany({
      where: {
        semester: "GANJIL", // Target harus GANJIL (tahun ajaran baru)
        OR: [
          // Tahun depan (misal: dari 2025/2026 → 2026/2027)
          {
            tahunMulai: {
              gt: currentClass.academicYear.tahunMulai,
            },
          },
          // Atau tahun yang sama tapi belum pernah digunakan (edge case)
          {
            tahunMulai: currentClass.academicYear.tahunMulai,
            tahunSelesai: {
              gt: currentClass.academicYear.tahunSelesai,
            },
          },
        ],
      },
      orderBy: [
        { tahunMulai: "asc" },
        { tahunSelesai: "asc" },
      ],
      take: 5, // Ambil max 5 tahun ke depan
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
      currentAcademicYear: {
        tahunMulai: currentClass.academicYear.tahunMulai,
        tahunSelesai: currentClass.academicYear.tahunSelesai,
        semester: currentClass.academicYear.semester,
      },
    });
  } catch (error) {
    console.error("Error fetching academic years for promotion:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    );
  }
}
