// 4️⃣ Submissions to Grade - GET /api/tutor/dashboard/submissions
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await getUserFromCookie();
  if (!user || user.role !== "TUTOR")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });

  // ✅ Ambil hanya pengajaran yang berada di tahun ajaran aktif
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

  const recentAssignments = await prisma.assignment.findMany({
    where: { classSubjectTutorId: { in: cstIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentQuizzes = await prisma.quiz.findMany({
    where: { classSubjectTutorId: { in: cstIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const submissions = await prisma.submission.findMany({
    where: {
      OR: [
        { assignmentId: { in: recentAssignments.map((a) => a.id) } },
        { quizId: { in: recentQuizzes.map((q) => q.id) } },
      ],
      status: "SUBMITTED",
    },
    include: {
      student: { include: { user: { select: { nama: true } } } },
      assignment: {
        include: {
          classSubjectTutor: { include: { subject: true, class: true } },
        },
      },
      quiz: {
        include: {
          classSubjectTutor: { include: { subject: true, class: true } },
        },
      },
    },
    orderBy: { waktuKumpul: "asc" },
    take: 10,
  });

  return NextResponse.json({ submissions });
}
