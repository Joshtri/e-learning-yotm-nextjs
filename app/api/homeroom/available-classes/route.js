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

    // Ambil parameter tahun ajaran dari query string
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    if (!academicYearId) {
      return NextResponse.json(
        { success: false, message: "Academic Year ID diperlukan" },
        { status: 400 }
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

    // Cari kelas saat ini untuk mengetahui program dan tingkat kelas
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
        program: true,
        academicYear: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
    });

    if (!currentClass) {
      return NextResponse.json(
        { success: false, message: "Kelas saat ini tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil semua kelas di tahun ajaran tujuan dengan program yang sama
    const availableClasses = await prisma.class.findMany({
      where: {
        academicYearId: academicYearId,
        programId: currentClass.programId, // Hanya kelas dengan program yang sama
      },
      include: {
        academicYear: true,
        program: true,
        homeroomTeacher: {
          include: {
            user: true,
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
      orderBy: {
        namaKelas: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: availableClasses.map((kelas) => ({
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        program: kelas.program.namaPaket,
        academicYear: {
          tahunMulai: kelas.academicYear.tahunMulai,
          tahunSelesai: kelas.academicYear.tahunSelesai,
          semester: kelas.academicYear.semester,
        },
        homeroomTeacher: kelas.homeroomTeacher
          ? {
              nama: kelas.homeroomTeacher.user.nama,
            }
          : null,
        studentCount: kelas._count.students,
      })),
      currentClass: {
        namaKelas: currentClass.namaKelas,
        program: currentClass.program.namaPaket,
        academicYear: {
          tahunMulai: currentClass.academicYear.tahunMulai,
          tahunSelesai: currentClass.academicYear.tahunSelesai,
          semester: currentClass.academicYear.semester,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching available classes:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server", error: error.message },
      { status: 500 }
    );
  }
}
