import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classes = await prisma.class.findMany({
      include: {
        program: true,
        academicYear: true,
        students: { select: { id: true } },
        classSubjectTutors: {
          include: {
            subject: true,
            tutor: { include: { user: { select: { nama: true } } } },
          },
        },
        homeroomTeacher: {
          include: {
            user: { select: { nama: true } },
          },
        },
      },
      orderBy: { namaKelas: "asc" },
    });

    return NextResponse.json(
      classes.map((cls) => ({
        id: cls.id,
        name: cls.namaKelas,
        program: cls.program.namaPaket,
        academicYear: `${cls.academicYear.tahunMulai}/${cls.academicYear.tahunSelesai}`,
        studentCount: cls.students.length,
        subjectCount: cls.classSubjectTutors.length,
        homeroomTeacher: cls.homeroomTeacher
          ? cls.homeroomTeacher.namaLengkap
          : "Belum ditentukan",
        subjects: cls.classSubjectTutors.map((cst) => ({
          id: cst.subject.id,
          name: cst.subject.namaMapel,
          tutor: cst.tutor.user.nama,
        })),
      }))
    );
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes data" },
      { status: 500 }
    );
  }
}
