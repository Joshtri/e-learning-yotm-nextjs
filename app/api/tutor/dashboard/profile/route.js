// Folder: /app/api/tutor/dashboard/
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

// 1️⃣ Profile - GET /api/tutor/dashboard/profile
export async function GET(req) {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
      include: {
        user: { select: { nama: true, email: true, lastLoginAt: true } },
      },
    });
  
    if (!tutor) return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
  
    return NextResponse.json({
      tutor: {
        id: tutor.id,
        name: tutor.namaLengkap || tutor.user.nama,
        email: tutor.user.email,
        bio: tutor.bio,
      },
    });
  }
  