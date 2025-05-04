import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(request) {
  try {
    // const user = await getUserFromCookie();

    // if (!user || user.role !== "HOMEROOM_TEACHER") {
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { academicYearId, classId, scores } = body;

    if (!academicYearId || !classId || !Array.isArray(scores)) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const operations = scores.map((entry) =>
      prisma.behaviorScore.upsert({
        where: {
          studentId_academicYearId: {
            studentId: entry.studentId,
            academicYearId,
          },
        },
        update: {
          spiritual: entry.spiritual,
          sosial: entry.sosial,
          kehadiran: entry.kehadiran,
          catatan: entry.catatan || null,
        },
        create: {
          studentId: entry.studentId,
          academicYearId,
          spiritual: entry.spiritual,
          sosial: entry.sosial,
          kehadiran: entry.kehadiran,
          catatan: entry.catatan || null,
        },
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      message: "Nilai sikap berhasil disimpan",
    });
  } catch (error) {
    console.error("Gagal menyimpan nilai behavior:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
