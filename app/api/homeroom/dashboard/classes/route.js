import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // 🔥 Cari semua kelas yang dipegang sebagai wali kelas
    const classes = await prisma.class.findMany({
      where: {
        homeroomTeacherId: tutor.id,
      },
      include: {
        students: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
        academicYear: true,
        program: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
    });

    return NextResponse.json({
      success: true,
      classes: classes.map((kelas) => ({
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        program: kelas.program?.namaPaket,
        totalStudents: kelas.students.length,
        academicYear: {
          id: kelas.academicYear.id,
          tahunMulai: kelas.academicYear.tahunMulai,
          tahunSelesai: kelas.academicYear.tahunSelesai,
          semester: kelas.academicYear.semester,
          isActive: kelas.academicYear.isActive,
        },
      })),
    });
  } catch (error) {
    console.error("Gagal memuat classes dashboard wali kelas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat classes." },
      { status: 500 }
    );
  }
}
