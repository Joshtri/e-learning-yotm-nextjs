import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET semua notifikasi untuk user tertentu
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID wajib disertakan" },
        { status: 400 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, nama: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat notifikasi" },
      { status: 500 }
    );
  }
}

// POST notifikasi baru
export async function POST(req) {
  try {
    const body = await req.json();
    const { senderId, receiverId, title, message, type } = body;

    if (!senderId || !receiverId || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const created = await prisma.notification.create({
      data: {
        senderId,
        receiverId,
        title,
        message,
        type: type || "GENERAL",
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengirim notifikasi" },
      { status: 500 }
    );
  }
}

// PATCH tandai notifikasi sebagai dibaca
export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID notifikasi diperlukan" },
        { status: 400 }
      );
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui notifikasi" },
      { status: 500 }
    );
  }
}
