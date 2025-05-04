// File: /app/api/homeroom/behavior-scores/students/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    // const user = await getUserFromCookie();

    // if (!user || user.role !== "HOMEROOM_TEACHER") {
    //   return NextResponse.json(
    //     { success: false, message: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "Parameter classId diperlukan" },
        { status: 400 }
      );
    }
    
    const kelas = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        academicYearId: true,
      },
    });
    
    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }
    
        const selectedClass = await prisma.class.findUnique({
          where: { id: classId },
          select: { academicYearId: true },
        });
        

    const academicYearId = kelas.academicYearId;

    const students = await prisma.student.findMany({
      where: {
        classId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        namaLengkap: true,
        nisn: true,
        BehaviorScore: {
          where: { academicYearId },
          select: {
            spiritual: true,
            sosial: true,
            kehadiran: true,
            catatan: true,
          },
        },
      },
      orderBy: {
        namaLengkap: "asc",
      },
    });

    const data = students.map((s) => ({
      id: s.id,
      namaLengkap: s.namaLengkap,
      behaviorScore: s.BehaviorScore[0],
      academicYearId, // tambahkan ini
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Gagal mengambil siswa untuk behavior score:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
