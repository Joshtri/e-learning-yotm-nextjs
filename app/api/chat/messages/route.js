import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET pesan dalam room tertentu
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { success: false, message: "roomId wajib disertakan" },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, nama: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("POST /api/chat/messages error:", error); // Tambahkan ini
    return NextResponse.json(
      { success: false, message: "Gagal mengirim pesan", error: error.message },
      { status: 500 }
    );
  }
}

// POST kirim pesan baru
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { roomId, content } = await req.json();
    if (!roomId || !content) {
      return NextResponse.json(
        { success: false, message: "roomId dan content wajib diisi" },
        { status: 400 }
      );
    }

    const existingRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });
    if (!existingRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room tidak ditemukan" },
        { status: 404 }
      );
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId,
        content,
        senderId: user.id,
      },
      include: {
        sender: { select: { id: true, nama: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("POST /api/chat/messages error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengirim pesan" },
      { status: 500 }
    );
  }
}
