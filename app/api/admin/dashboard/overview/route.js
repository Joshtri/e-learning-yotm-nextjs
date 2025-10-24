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

    const [
      totalStudents,
      totalTutors,
      totalClasses,
      totalSubjects,
      totalPrograms,
      totalAssignments,
      totalQuizzes,
      totalMaterials,
      currentAcademicYear
    ] = await Promise.all([
      prisma.student.count(),
      prisma.tutor.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.program.count(),
      prisma.assignment.count(),
      prisma.quiz.count(),
      prisma.learningMaterial.count(),
      prisma.academicYear.findFirst({ where: { isActive: true } })
    ]);

    return NextResponse.json({
      totalStudents,
      totalTutors,
      totalClasses,
      totalSubjects,
      totalPrograms,
      totalAssignments,
      totalQuizzes,
      totalMaterials,
      currentAcademicYear: currentAcademicYear ? {
        id: currentAcademicYear.id,
        year: `${currentAcademicYear.tahunMulai}/${currentAcademicYear.tahunSelesai}`,
        semester: currentAcademicYear.semester
      } : null
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}