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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "Parameter classId wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil data tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Data tutor tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil siswa dari kelas asal
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        id: true,
        namaLengkap: true,
        classId: true,
        // Optional: bisa juga tambahkan nilai akhir dari riwayat
        StudentClassHistory: {
          where: { classId },
          select: {
            nilaiAkhir: true,
          },
        },
      },
    });

    // Ambil kelas tujuan dari tahun ajaran berikutnya
    const kelasAsal = await prisma.class.findUnique({
      where: { id: classId },
      include: { academicYear: true, program: true },
    });

    if (!kelasAsal) {
      return NextResponse.json(
        { success: false, message: "Kelas asal tidak ditemukan" },
        { status: 404 }
      );
    }

    const nextYear = await prisma.academicYear.findFirst({
      where: {
        tahunMulai: kelasAsal.academicYear.tahunMulai + 1,
      },
    });

    if (!nextYear) {
      return NextResponse.json({
        success: false,
        message: "Tahun ajaran berikutnya belum tersedia",
      });
    }

    const targetClasses = await prisma.class.findMany({
      where: {
        academicYearId: nextYear.id,
        programId: kelasAsal.programId,
      },
      include: {
        academicYear: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        students: students.map((s) => ({
          ...s,
          nilaiAkhir: s.StudentClassHistory[0]?.nilaiAkhir ?? null,
        })),
        targetClasses,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data promosi:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
