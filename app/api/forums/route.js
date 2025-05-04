import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tutorView = searchParams.get("tutorView") === "true";

    const forums = await prisma.chatRoom.findMany({
      where: {
        type: "FORUM",
        ...(tutorView
          ? {
              OR: [
                { createdById: user.id },
                { users: { some: { id: user.id } } },
              ],
            }
          : {
              users: { some: { id: user.id } },
            }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            nama: true,
          },
        },
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
          },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: forums });
  } catch (error) {
    console.error("[GET /forums] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, classSubjectTutorId } = body;

    if (!name || !classSubjectTutorId) {
      return NextResponse.json(
        { message: "Nama dan kelas/mapel wajib diisi" },
        { status: 400 }
      );
    }

    const classSubject = await prisma.classSubjectTutor.findUnique({
      where: { id: classSubjectTutorId },
      include: {
        class: {
          include: {
            students: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!classSubject) {
      return NextResponse.json(
        { message: "Data kelas/mapel tidak ditemukan" },
        { status: 404 }
      );
    }

    const forum = await prisma.chatRoom.create({
      data: {
        name,
        type: "FORUM",
        createdById: user.id,
        classSubjectTutorId, // ✅ disimpan di database
        users: {
          connect: [
            { id: user.id },
            ...classSubject.class.students.map((s) => ({ id: s.userId })),
          ],
        },
      },
    });

    return NextResponse.json(forum, { status: 201 });
  } catch (error) {
    console.error("[POST /forums]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
