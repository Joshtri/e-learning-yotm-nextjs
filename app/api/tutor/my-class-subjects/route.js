import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
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
    
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: {
        tutorId: tutor.id,
        class: {
          academicYear: {
            isActive: true,
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            namaKelas: true,
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
                isActive: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            namaMapel: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({
      success: true,
      data: classSubjectTutors,
    });
  } catch (error) {
    console.error("Gagal ambil data pengajaran tutor:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data kelas-mapel tutor",
      },
      { status: 500 }
    );
  }
}
