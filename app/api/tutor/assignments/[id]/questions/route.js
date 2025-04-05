import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req, context) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignmentId = context.params.id;
    const body = await req.json();
    const { questions } = body;

    if (!assignmentId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(
      questions.map((q) =>
        prisma.question.create({
          data: {
            assignmentId,
            teks: q.teks,
            jenis: q.jenis || "ESSAY",
            poin: q.poin ? Number(q.poin) : null,
            pembahasan: q.pembahasan || null,
          },
        })
      )
    );

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Gagal menyimpan soal exercise:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignmentId = context.params.id;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, message: "Assignment ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const questions = await prisma.question.findMany({
      where: { assignmentId },
      orderBy: { id: "asc" }, // Urutkan berdasarkan ID yang lebih stabil
    });
    
    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    console.error("Gagal mengambil soal assignment:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
