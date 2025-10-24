import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cari tutorId berdasarkan userId
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("User ID:", user.id);
    console.log("Tutor ID:", tutor.id);

    const { searchParams } = new URL(request.url);
    let academicYearId = searchParams.get("academicYearId");

    // Fallback ke tahun ajaran aktif jika tidak diberikan
    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      });

      academicYearId = activeYear?.id;

      if (!academicYearId) {
        return NextResponse.json(
          { success: false, message: "Tidak ada tahun ajaran aktif" },
          { status: 400 }
        );
      }
    }

    const data = await prisma.classSubjectTutor.findMany({
      where: {
        tutorId: tutor.id,
        class: {
          academicYearId: academicYearId,
        },
      },
      include: {
        class: {
          select: {
            id: true,
            namaKelas: true,
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                isActive: true,
                semester: true,
              },
            },
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
            homeroomTeacher: {
              select: {
                id: true,
                namaLengkap: true,
                userId: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            namaMapel: true,
          },
        },
        tutor: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Gagal mengambil data kelas yang diajar tutor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data kelas",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
