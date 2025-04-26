import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET Detail BehaviorScore
export async function GET(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const score = await prisma.behaviorScore.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { namaLengkap: true } },
        academicYear: { select: { tahunMulai: true, tahunSelesai: true } },
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
      { success: false, message: "Gagal memuat nilai sikap" },
      { status: 500 }
    );
  }
}

// DELETE BehaviorScore
export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.behaviorScore.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Nilai sikap dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus nilai sikap" },
      { status: 500 }
    );
  }
}

// Tambahan PATCH untuk Update BehaviorScore
export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const updated = await prisma.behaviorScore.update({
      where: { id: params.id },
      data: {
        spiritual: body.spiritual,
        sosial: body.sosial,
        kehadiran: body.kehadiran,
        catatan: body.catatan,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal update nilai sikap" },
      { status: 500 }
    );
  }
}
