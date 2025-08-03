import { getUserFromCookie } from "@/utils/auth"; // sudah reusable
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        id,
        tutorId: tutor.id, // Validasi kepemilikan
      },
      include: {
        class: {
          include: {
            program: true,
            academicYear: true,
            students: {
              include: {
                user: true,
              },
            },
          },
        },
        subject: true,
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        { success: false, message: "Data tidak ditemukan atau akses ditolak" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        class: classSubjectTutor.class,
        subject: classSubjectTutor.subject,
        students: classSubjectTutor.class.students,
      },
    });
  } catch (error) {
    console.error("Gagal ambil detail siswa:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data" },
      { status: 500 }
    );
  }
}
