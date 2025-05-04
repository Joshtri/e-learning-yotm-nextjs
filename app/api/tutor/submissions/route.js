// app/api/tutor/submissions/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request) {
  try {
    // 1. Autentikasi user dengan role TUTOR
    const { user, error, status } = await getAuthUser(request, ["TUTOR"]);
    if (error || !user) {
      return NextResponse.json(
        { message: error || "Unauthorized" },
        { status }
      );
    }

    // 2. Cek tutor berdasarkan userId
    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    // 3. Ambil academicYearId dari query atau default ke tahun aktif
    const { searchParams } = new URL(request.url);
    let academicYearId = searchParams.get("academicYearId");

    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      academicYearId = activeYear?.id || null;
    }

    // 4. Query data submissions berdasarkan class.academicYearId
    const submissions = await prisma.submission.findMany({
      where: {
        OR: [
          {
            assignmentId: { not: null },
            assignment: {
              classSubjectTutor: {
                tutorId: tutor.id,
                class: academicYearId ? { academicYearId } : undefined,
              },
            },
          },
          {
            quizId: { not: null },
            quiz: {
              classSubjectTutor: {
                tutorId: tutor.id,
                class: academicYearId ? { academicYearId } : undefined,
              },
            },
          },
        ],
      },
      include: {
        student: {
          select: {
            id: true,
            namaLengkap: true,
            nisn: true,
          },
        },
        assignment: {
          select: {
            id: true,
            judul: true,
            jenis: true,
            classSubjectTutor: {
              select: {
                class: {
                  select: {
                    namaKelas: true,
                    academicYearId: true,
                  },
                },
                subject: {
                  select: { namaMapel: true },
                },
              },
            },
          },
        },
        quiz: {
          select: {
            id: true,
            judul: true,
            classSubjectTutor: {
              select: {
                class: {
                  select: {
                    namaKelas: true,
                    academicYearId: true,
                  },
                },
                subject: {
                  select: { namaMapel: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: submissions });
  } catch (error) {
    console.error("Gagal ambil submissions:", error);
    return NextResponse.json(
      { success: false, message: "Gagal ambil submissions" },
      { status: 500 }
    );
  }
}
