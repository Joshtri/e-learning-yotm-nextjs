import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return NextResponse.json(
      { success: false, message: "Token invalid" },
      { status: 401 }
    );
  }

  // ==========================================
  // TUTOR: siswa yang diajar, tutor lain, admin
  // ==========================================
  if (user.role === "TUTOR") {
    const classSubjectTutor = await prisma.classSubjectTutor.findMany({
      where: {
        tutor: {
          userId: user.id,
        },
      },
      include: {
        class: {
          include: {
            students: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const studentUsers = classSubjectTutor.flatMap((entry) =>
      entry.class.students.map((s) => s.user)
    );

    const otherTutors = await prisma.user.findMany({
      where: {
        role: "TUTOR",
        id: { not: user.id },
      },
      select: {
        id: true,
        nama: true,
        role: true,
      },
    });

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        nama: true,
        role: true,
      },
    });

    const combined = [
      ...studentUsers.map(({ id, nama, role }) => ({ id, nama, role })),
      ...otherTutors,
      ...admins,
    ];

    const uniqueUsers = Array.from(
      new Map(combined.map((u) => [u.id, u])).values()
    );

    return NextResponse.json({ success: true, data: uniqueUsers });
  }

  // ==========================================
  // STUDENT: boleh chat ke TUTOR, HOMEROOM_TEACHER, ADMIN
  // ==========================================
  if (user.role === "STUDENT") {
    const allowedRoles = ["TUTOR", "HOMEROOM_TEACHER", "ADMIN"];
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        role: { in: allowedRoles },
      },
      select: {
        id: true,
        nama: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: users });
  }

  // ==========================================
  // HOMEROOM_TEACHER: boleh chat ke STUDENT, TUTOR, ADMIN
  // ==========================================
  if (user.role === "HOMEROOM_TEACHER") {
    const allowedRoles = ["STUDENT", "TUTOR", "ADMIN"];
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        role: { in: allowedRoles },
      },
      select: {
        id: true,
        nama: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: users });
  }

  // ==========================================
  // ADMIN: bisa lihat semua user kecuali dirinya sendiri
  // ==========================================
  if (user.role === "ADMIN") {
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
      },
      select: {
        id: true,
        nama: true,
        role: true,
      },
    });

    return NextResponse.json({ success: true, data: users });
  }

  return NextResponse.json({ success: true, data: [] });
}
