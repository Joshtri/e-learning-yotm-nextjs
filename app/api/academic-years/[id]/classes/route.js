import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request, { params }) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id: academicYearId } = resolvedParams;

    // Get academic year info
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json(
        { success: false, message: "Tahun akademik tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get all classes in this academic year with student count and homeroom teacher
    const classes = await prisma.class.findMany({
      where: {
        academicYearId: academicYearId,
      },
      include: {
        program: {
          select: {
            namaPaket: true,
          },
        },
        homeroomTeacher: {
          select: {
            id: true,
            user: {
              select: {
                nama: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: {
              where: {
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: [
        { namaKelas: "asc" },
      ],
    });

    // Format response
    const formattedClasses = classes.map((cls) => ({
      id: cls.id,
      namaKelas: cls.namaKelas,
      program: cls.program?.namaProgram || "-",
      homeroomTeacher: cls.homeroomTeacher?.user?.namaLengkap || "Belum ada wali kelas",
      studentCount: cls._count.students,
      createdAt: cls.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        academicYear: {
          id: academicYear.id,
          tahunMulai: academicYear.tahunMulai,
          tahunSelesai: academicYear.tahunSelesai,
          semester: academicYear.semester,
          isActive: academicYear.isActive,
        },
        classes: formattedClasses,
        totalClasses: formattedClasses.length,
        totalStudents: formattedClasses.reduce((sum, cls) => sum + cls.studentCount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching classes by academic year:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    );
  }
}
