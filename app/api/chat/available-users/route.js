// app/api/chat/available-users/route.js
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

  if (user.role === "TUTOR") {
    // Ambil siswa dari kelas yang diajar tutor ini
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

    // Ambil semua siswa yang diajar
    const studentUsers = classSubjectTutor.flatMap((entry) =>
      entry.class.students.map((s) => s.user)
    );

    // Ambil tutor lain
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

    // Gabungkan & hilangkan duplikat
    const combined = [
      ...studentUsers.map(({ id, nama, role }) => ({ id, nama, role })),
      ...otherTutors,
    ];
    const uniqueUsers = Array.from(
      new Map(combined.map((u) => [u.id, u])).values()
    );

    return NextResponse.json({ success: true, data: uniqueUsers });
  }

  // Selain TUTOR, tampilkan semua user kecuali dirinya sendiri
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
