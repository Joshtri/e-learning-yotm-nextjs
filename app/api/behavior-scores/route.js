import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const behaviorScores = await prisma.behaviorScore.findMany({
      include: {
        student: { select: { namaLengkap: true } },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: behaviorScores });
  } catch (error) {
    console.error("Gagal memuat nilai sikap:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat nilai sikap" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, academicYearId, spiritual, sosial, kehadiran, catatan } =
      body;

    const behaviorScore = await prisma.behaviorScore.upsert({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId,
        },
      },
      update: {
        spiritual,
        sosial,
        kehadiran,
        catatan,
      },
      create: {
        studentId,
        academicYearId,
        spiritual,
        sosial,
        kehadiran,
        catatan,
      },
    });

    return NextResponse.json({ success: true, data: behaviorScore });
  } catch (error) {
    console.error("Gagal input nilai sikap:", error);
    return NextResponse.json(
      { success: false, message: "Gagal input nilai sikap" },
      { status: 500 }
    );
  }
}
