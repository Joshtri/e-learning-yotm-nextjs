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

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Cari tutor berdasarkan userId
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil kelas yang di-wali oleh homeroom teacher
    const whereClause = {
      homeroomTeacherId: tutor.id,
      ...(academicYearId && { academicYearId }),
    };

    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        program: {
          select: {
            id: true,
            namaPaket: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            tahunMulai: true,
            tahunSelesai: true,
            semester: true,
            isActive: true,
          },
        },
        students: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
      orderBy: [{ academicYear: { tahunMulai: "desc" } }, { namaKelas: "asc" }],
    });

    const enrichedClasses = await Promise.all(
      classes.map(async (kelas) => {
        let studentCount = kelas.students.length;

        // Jika tidak ada siswa aktif, ambil dari BehaviorScore
        if (studentCount === 0) {
          const grouped = await prisma.behaviorScore.groupBy({
            by: ["studentId"],
            where: {
              classId: kelas.id,
              academicYearId: kelas.academicYearId,
            },
          });

          studentCount = grouped.length;
        }

        return {
          ...kelas,
          _count: { students: studentCount },
          students: undefined, // jangan kirim array siswa
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedClasses,
    });
  } catch (error) {
    console.error("Error fetching homeroom classes:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
