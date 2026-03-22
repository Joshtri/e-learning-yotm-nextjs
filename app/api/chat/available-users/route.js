import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
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
      entry.class.students.map((s) => ({
        id: s.user.id,
        nama: s.user.nama,
        role: s.user.role,
      }))
    );

    const uniqueUsers = Array.from(
      new Map(studentUsers.map((u) => [u.id, u])).values()
    );

    return NextResponse.json({ success: true, data: uniqueUsers });
  }

  // ==========================================
  // STUDENT: boleh chat ke TUTOR, HOMEROOM_TEACHER, ADMIN
  // ==========================================
  if (user.role === "STUDENT") {
    // 1. Dapatkan profil siswa untuk mengetahui classId
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: { classId: true },
    });

    if (!student || !student.classId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Dapatkan tutor yang mengajar di kelas ini
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { classId: student.classId },
      include: {
        tutor: {
          include: { user: true },
        },
      },
    });

    const tutorUsers = classSubjectTutors
      .map((cst) => cst.tutor?.user)
      .filter((u) => u !== null && u !== undefined);

    // 3. Dapatkan teman sekelas
    const classmates = await prisma.student.findMany({
      where: {
        classId: student.classId,
        userId: { not: user.id }, // Kecuali diri sendiri
      },
      include: {
        user: true,
      },
    });

    const classmateUsers = classmates.map((s) => s.user);

    // 4. Gabungkan dan unikkan
    const combined = [
      ...tutorUsers.map(({ id, nama, role }) => ({ id, nama, role })),
      ...classmateUsers.map(({ id, nama, role }) => ({ id, nama, role })),
    ];

    const uniqueUsers = Array.from(
      new Map(combined.map((u) => [u.id, u])).values()
    );

    return NextResponse.json({ success: true, data: uniqueUsers });
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
