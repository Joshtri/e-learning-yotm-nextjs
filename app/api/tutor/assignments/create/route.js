import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const {
      judul,
      deskripsi,
      classSubjectTutorId,
      waktuMulai,
      waktuSelesai,
      batasWaktuMenit,
      nilaiMaksimal,
    } = await req.json();

    if (!judul || !classSubjectTutorId || !waktuMulai || !waktuSelesai) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        judul,
        deskripsi,
        jenis: "EXERCISE", // default untuk tugas biasa
        classSubjectTutorId,
        waktuMulai: new Date(waktuMulai),
        waktuSelesai: new Date(waktuSelesai),
        batasWaktuMenit,
        nilaiMaksimal,
      },
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error) {
    console.error("Gagal membuat tugas:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
