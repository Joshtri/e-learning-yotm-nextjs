import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { student: true, tutor: true }
    });

    return NextResponse.json(users.map(user => ({
      id: user.id,
      name: user.nama,
      role: user.role,
      createdAt: user.createdAt,
      studentId: user.student?.id || null,
      tutorId: user.tutor?.id || null
    })));
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent users" },
      { status: 500 }
    );
  }
}