import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
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

  try {
    const { id: assignmentId } = params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: true,
      },
    });

    if (!assignment || assignment.classSubjectTutor.tutorId !== tutor.id) {
      return NextResponse.json(
        { message: "Akses ditolak ke ujian ini" },
        { status: 403 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: {
              select: { nama: true },
            },
          },
        },
      },
      orderBy: {
        waktuKumpul: "desc",
      },
    });

    const formatted = submissions.map((sub) => ({
      ...sub,
      student: {
        ...sub.student,
        namaLengkap: sub.student.namaLengkap || sub.student.user?.nama || "-",
      },
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Gagal ambil hasil ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat hasil ujian" },
      { status: 500 }
    );
  }
}
