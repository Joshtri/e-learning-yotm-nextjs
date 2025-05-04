// app/api/tutor/assignments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Cari academic year aktif
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    if (!activeAcademicYear) {
      return NextResponse.json(
        { success: false, message: "Tahun ajaran aktif tidak ditemukan" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const yearId = searchParams.get("academicYearId") || activeAcademicYear.id;

    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutor: {
          tutorId: tutor.id,
          class: {
            academicYearId: yearId,
          },
        },
        jenis: "EXERCISE",
      },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Gagal memuat data assignments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
