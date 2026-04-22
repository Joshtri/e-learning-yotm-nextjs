import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// GET - Detail forum
export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const forum = await prisma.chatRoom.findUnique({
      where: { id, type: "FORUM" },
      select: {
        id: true,
        name: true,
        closed: true,
        createdById: true,
      },
    });

    if (!forum) {
      return NextResponse.json(
        { success: false, message: "Forum tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: forum });
  } catch (error) {
    console.error("[GET /forums/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - Akhiri/buka kembali forum
export async function PATCH(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { closed } = await req.json();

    // Pastikan forum ada dan dibuat oleh tutor ini
    const forum = await prisma.chatRoom.findUnique({
      where: { id, type: "FORUM" },
      select: { createdById: true },
    });

    if (!forum) {
      return NextResponse.json(
        { success: false, message: "Forum tidak ditemukan" },
        { status: 404 }
      );
    }

    if (forum.createdById !== user.id) {
      return NextResponse.json(
        { success: false, message: "Hanya pembuat forum yang dapat mengakhiri forum" },
        { status: 403 }
      );
    }

    const updated = await prisma.chatRoom.update({
      where: { id },
      data: { closed: Boolean(closed) },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: closed ? "Forum berhasil diakhiri" : "Forum berhasil dibuka kembali",
    });
  } catch (error) {
    console.error("[PATCH /forums/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
