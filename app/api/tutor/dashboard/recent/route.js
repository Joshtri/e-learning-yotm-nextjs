// 3️⃣ Recent Activities - GET /api/tutor/dashboard/recent

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "TUTOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });

  // ✅ Hanya ambil pengajaran dengan tahun ajaran aktif
  const classSubjectTutors = await prisma.classSubjectTutor.findMany({
    where: {
      tutorId: tutor?.id,
      class: {
        academicYear: {
          isActive: true,
        },
      },
    },
  });

  const cstIds = classSubjectTutors.map((c) => c.id);

  const [assignments, quizzes, materials] = await Promise.all([
    prisma.assignment.findMany({
      where: { classSubjectTutorId: { in: cstIds } },
      include: {
        classSubjectTutor: { include: { class: true, subject: true } },
        submissions: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.quiz.findMany({
      where: { classSubjectTutorId: { in: cstIds } },
      include: {
        classSubjectTutor: { include: { class: true, subject: true } },
        submissions: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.learningMaterial.findMany({
      where: { classSubjectTutorId: { in: cstIds } },
      include: {
        classSubjectTutor: { include: { class: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    recentAssignments: assignments,
    recentQuizzes: quizzes,
    recentMaterials: materials,
  });
}
