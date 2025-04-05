import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, bio, education, experience, phone } = body;

    if (!userId || !bio || !education || !experience || !phone) {
      return NextResponse.json(
        { message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.tutor.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Profil tutor sudah ada." },
        { status: 400 }
      );
    }

    const newTutor = await prisma.tutor.create({
      data: {
        userId,
        bio,
        education,
        experience,
        phone,
        // photoUrl,
      },
    });

    return NextResponse.json({
      message: "Berhasil menyimpan data tutor.",
      tutor: newTutor,
    });
  } catch (error) {
    console.error("[ONBOARDING_TUTOR_ERROR]", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menyimpan data tutor." },
      { status: 500 }
    );
  }
}
