// File: app/api/siswa/assignments/[id]/start/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
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

    const questions = await prisma.question.findMany({
      where: { assignmentId: assignment.id },
      orderBy: { id: "asc" },
    });

    const submission = await prisma.submission.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId: student.id,
      },
      include: {
        answers: true,
      },
    });

    const answersMap = {};
    if (submission) {
      submission.answers.forEach((ans) => {
        answersMap[ans.questionId] = ans.jawaban;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment,
        questions,
        previousAnswers: answersMap,
        submission,
      },
    });
  } catch (error) {
    console.error("Gagal ambil data pengerjaan tugas siswa:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
