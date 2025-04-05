import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // sesuaikan path dengan project kamu

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, nisn, gender, birthPlace, birthDate, address } = body;

    if (!userId || !nisn || !gender || !birthPlace || !birthDate || !address) {
      return NextResponse.json(
        { message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.student.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Profil siswa sudah ada." },
        { status: 400 }
      );
    }

    const newStudent = await prisma.student.create({
      data: {
        userId,
        nisn,
        gender,
        birthPlace,
        birthDate: new Date(birthDate),
        address,
      },
    });

    return NextResponse.json({
      message: "Berhasil menyimpan data.",
      student: newStudent,
    });
  } catch (error) {
    console.error("[ONBOARDING_STUDENT_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan data." },
      { status: 500 }
    );
  }
}
