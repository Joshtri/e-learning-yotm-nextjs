// /app/api/tutor/promote-students/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

 

export async function POST(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Cek tutor dari user login
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { classId, targetClassId, promotions } = body;

    if (!classId || !targetClassId || !Array.isArray(promotions)) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Validasi: pastikan tutor memang mengajar di classId
    const classAccess = await prisma.classSubjectTutor.findFirst({
      where: {
        tutorId: tutor.id,
        classId,
      },
    });

    if (!classAccess) {
      return NextResponse.json(
        { success: false, message: "Anda tidak memiliki akses ke kelas ini" },
        { status: 403 }
      );
    }

    const updates = promotions.map(async ({ studentId, naikKelas }) => {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: { include: { academicYear: true } } },
      });

      if (!student || !student.class) return;

      await prisma.studentClassHistory.create({
        data: {
          studentId,
          classId,
          academicYearId: student.class.academicYearId,
          naikKelas,
          nilaiAkhir: student.nilaiAkhir ?? null,
        },
      });

      if (naikKelas) {
        await prisma.student.update({
          where: { id: studentId },
          data: { classId: targetClassId },
        });
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal memproses naik kelas massal:", error);
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
