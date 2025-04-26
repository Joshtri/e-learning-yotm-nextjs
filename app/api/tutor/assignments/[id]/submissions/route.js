// File: app/api/tutor/assignments/[id]/submissions/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignmentId = params.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              include: {
                students: {
                  include: { user: true },
                },
              },
            },
            subject: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    const allStudents = assignment.classSubjectTutor.class.students;

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const submissionsMap = new Map(submissions.map((s) => [s.studentId, s]));

    const result = allStudents.map((student) => {
      const s = submissionsMap.get(student.id);
      return {
        id: s?.id || `pending_${student.id}`,
        nama: student.namaLengkap || student.user?.nama || "-",
        status: s?.status || "NOT_STARTED",
        nilai: s?.nilai ?? null,
        waktuKumpul: s?.waktuKumpul ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        submissions: result,
      },
    });
  } catch (error) {
    console.error("Gagal mengambil data submissions:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
