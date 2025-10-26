// /app/api/auth/me/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ tambahkan ini untuk fetch user lengkap

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        student: decoded.role === "STUDENT" && {
          select: {
            id: true,
            namaLengkap: true,
            nisn: true,
            nis: true,
            jenisKelamin: true,
            tempatLahir: true,
            tanggalLahir: true,
            alamat: true,
            fotoUrl: true,
            status: true,
            noTelepon: true,
            classId: true,
          },
        },
        tutor: decoded.role === "TUTOR" && {
          select: {
            id: true,
            namaLengkap: true,
            bio: true,
            pendidikan: true,
            pengalaman: true,
            telepon: true,
            fotoUrl: true,
            status: true,
            homeroomClasses: {
              select: {
                id: true,
                namaKelas: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("JWT verify error:", error);
    return NextResponse.json({ user: null });
  }
}
