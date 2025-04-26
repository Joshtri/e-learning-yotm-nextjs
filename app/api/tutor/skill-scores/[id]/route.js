import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET Detail SkillScore
export async function GET(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const score = await prisma.skillScore.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { namaLengkap: true } },
        subject: { select: { namaMapel: true } },
      },
    });

    if (!score) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: score });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat nilai keterampilan" },
      { status: 500 }
    );
  }
}

// DELETE SkillScore
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.skillScore.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Nilai keterampilan dihapus",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus nilai keterampilan" },
      { status: 500 }
    );
  }
}

// Tambahan PATCH untuk Update SkillScore
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updated = await prisma.skillScore.update({
      where: { id: params.id },
      data: {
        nilai: body.nilai,
        keterangan: body.keterangan,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal update nilai keterampilan" },
      { status: 500 }
    );
  }
}


