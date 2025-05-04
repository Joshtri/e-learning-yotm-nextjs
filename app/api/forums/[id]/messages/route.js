import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

// GET semua pesan di forum
export async function GET(req, { params }) {
  try {
    const roomId = params.id;

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("[GET /forums/:id/messages]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST kirim pesan
export async function POST(req, context) {
  const { params } = await context;
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json(
        { message: "Isi pesan wajib diisi" },
        { status: 400 }
      );
    }

    const newMsg = await prisma.chatMessage.create({
      data: {
        content,
        senderId: user.id,
        roomId: params.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            nama: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: newMsg }, { status: 201 });
  } catch (error) {
    console.error("[POST /forums/:id/messages]", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
