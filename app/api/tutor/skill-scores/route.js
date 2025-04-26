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

    // Ambil semua nilai praktek yg mapelnya dipegang tutor ini
    const tutorSubjects = await prisma.classSubjectTutor.findMany({
      where: { tutorId: user.id },
      select: { subjectId: true },
    });

    const subjectIds = tutorSubjects.map((s) => s.subjectId);

    const skillScores = await prisma.skillScore.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        student: { select: { namaLengkap: true } },
        subject: { select: { namaMapel: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: skillScores });
  } catch (error) {
    console.error("Gagal memuat nilai praktek:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat nilai praktek" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studentId, subjectId, nilai, keterangan } = body;

    const skillScore = await prisma.skillScore.upsert({
      where: {
        studentId_subjectId: {
          studentId,
          subjectId,
        },
      },
      update: {
        nilai,
        keterangan,
      },
      create: {
        studentId,
        subjectId,
        nilai,
        keterangan,
      },
    });

    return NextResponse.json({ success: true, data: skillScore });
  } catch (error) {
    console.error("Gagal input nilai keterampilan:", error);
    return NextResponse.json(
      { success: false, message: "Gagal input nilai keterampilan" },
      { status: 500 }
    );
  }
}
