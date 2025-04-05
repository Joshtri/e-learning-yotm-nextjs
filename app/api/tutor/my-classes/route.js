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

    // ✅ Cari tutorId berdasarkan user.id
    const tutor = await prisma.tutor.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    const tutorId = tutor.id;
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    const data = await prisma.classSubjectTutor.findMany({
      where: {
        tutorId,
        class: academicYearId
          ? {
              academicYearId,
            }
          : undefined,
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
              },
            },
            program: {
              select: {
                id: true,
                namaPaket: true,
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
