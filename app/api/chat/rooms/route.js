// /api/chat/rooms/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET: ambil semua chat room user saat ini
export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        users: {
          some: { id: user.id },
        },
      },
      include: {
        users: {
          select: { id: true, nama: true, role: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Urutkan berdasarkan pesan terakhir (jika ada)
    rooms.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt ?? 0;
      const bTime = b.messages[0]?.createdAt ?? 0;
      return new Date(bTime) - new Date(aTime);
    });

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("GET /api/chat/rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat chat room" },
      { status: 500 }
    );
  }
}

// POST: buat chat room baru jika belum ada
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, message: "Target user ID diperlukan" },
        { status: 400 }
      );
    }

    // Cek apakah room sudah ada
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        users: {
          every: {
            id: {
              in: [user.id, targetUserId],
            },
          },
        },
      },
      include: {
        users: true,
      },
    });

    if (existingRoom) {
      return NextResponse.json({ success: true, data: existingRoom });
    }

    const newRoom = await prisma.chatRoom.create({
      data: {
        users: {
          connect: [{ id: user.id }, { id: targetUserId }],
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json({ success: true, data: newRoom });
  } catch (error) {
    console.error("POST /api/chat/rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat chat room" },
      { status: 500 }
    );
  }
}
