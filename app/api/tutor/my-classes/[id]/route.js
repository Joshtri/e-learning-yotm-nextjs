import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request, { params }) {
  try {
    const user = getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const classSubjectTutorId = params.id;

    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        id: classSubjectTutorId,
        tutorId: tutor.id,
      },
      include: {
        class: {
          include: {
            program: true,
            academicYear: true,
          },
        },
        subject: true,
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        { message: "Kelas tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Berhasil mendapatkan data kelas",
      data: classSubjectTutor,
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
