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
    };

    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }

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
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { namaKelas: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error("Error fetching homeroom classes:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
