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

    // 🔥 Cari kelas yang dipegang sebagai wali kelas
    const allClasses = await prisma.class.findMany({
      where: {
        homeroomTeacherId: tutor.id,
      },
      include: {
        students: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: { nama: true, email: true },
            },
          },
        },
        academicYear: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
    });

    if (!allClasses || allClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Pilih kelas yang punya siswa aktif
    let kelas = allClasses.find((cls) => cls.students.length > 0);
    if (!kelas) {
      kelas = allClasses[0];
    }

    // Format student data
    const students = kelas.students.map((student) => ({
      id: student.id,
      namaLengkap: student.namaLengkap,
      email: student.user.email,
      nisn: student.nisn,
      status: student.status,
    }));

    return NextResponse.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Gagal memuat students dashboard wali kelas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat students." },
      { status: 500 }
    );
  }
}
