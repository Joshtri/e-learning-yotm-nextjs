import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
      include: {
        classSubjectTutors: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
            assignments: {
              include: {
                submissions: true,
              },
            },
            quizzes: {
              include: {
                submissions: true,
              },
            },
          },
        },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Calculate statistics
    let totalStudents = 0;
    let totalAssignments = 0;
    let totalQuizzes = 0;
    let submittedSubmissions = 0;
    let gradedSubmissions = 0;
    let lateSubmissions = 0;
    let totalSubmissions = 0;
    let totalScore = 0;

    tutor.classSubjectTutors.forEach((cst) => {
      // Count unique students across all classes
      totalStudents += cst.class.students.length;

      // Count assignments and quizzes
      totalAssignments += cst.assignments.length;
      totalQuizzes += cst.quizzes.length;

      // Process assignment submissions
      cst.assignments.forEach((assignment) => {
        assignment.submissions.forEach((submission) => {
          totalSubmissions++;
          if (submission.status === "SUBMITTED") submittedSubmissions++;
          if (submission.status === "GRADED") gradedSubmissions++;
          if (submission.isLate) lateSubmissions++;
          if (submission.score) totalScore += submission.score;
        });
      });

      // Process quiz submissions
      cst.quizzes.forEach((quiz) => {
        quiz.submissions.forEach((submission) => {
          totalSubmissions++;
          if (submission.status === "SUBMITTED") submittedSubmissions++;
          if (submission.status === "GRADED") gradedSubmissions++;
          if (submission.isLate) lateSubmissions++;
          if (submission.score) totalScore += submission.score;
        });
      });
    });

    const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;

    const statistics = {
      totalStudents,
      totalAssignments,
      totalQuizzes,
      submissions: {
        submitted: submittedSubmissions,        
        graded: gradedSubmissions,
        late: lateSubmissions,
        total: totalSubmissions,
        averageScore,
      },
    };

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}