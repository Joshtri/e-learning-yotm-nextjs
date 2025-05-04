import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";


// 2️⃣ Classes - GET /api/tutor/dashboard/classes
export async function GET(req) {
  const user = getUserFromCookie();
  if (!user || user.role !== "TUTOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
  if (!tutor)
    return NextResponse.json({ error: "Tutor not found" }, { status: 404 });

  const classSubjectTutors = await prisma.classSubjectTutor.findMany({
    where: {
      tutorId: tutor.id,
      class: {
        academicYear: {
          isActive: true, // ✅ hanya tahun ajaran aktif
        },
      },
    },
    include: {
      class: {
        include: {
          program: true,
          academicYear: true,
          students: { select: { id: true } },
        },
      },
      subject: true,
    },
  });
  
  const classStats = classSubjectTutors.map((cst) => {
    return {
      classId: cst.class.id,
      className: cst.class.namaKelas,
      program: cst.class.program.namaPaket,
      subject: cst.subject.namaMapel,
      totalStudents: cst.class.students.length,
      academicYear: `${cst.class.academicYear.tahunMulai}/${cst.class.academicYear.tahunSelesai}`,
    };
  });

  return NextResponse.json({ classes: classStats });
}
