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

    // Ambil semua siswa dari kelas dan urutkan berdasarkan nama
    const allStudents = assignment.classSubjectTutor.class.students.sort((a, b) => {
      const nameA = a.namaLengkap || a.user?.nama || "";
      const nameB = b.namaLengkap || b.user?.nama || "";
      return nameA.localeCompare(nameB);
    });

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
      const submission = submissionsMap.get(student.id);

      return {
        id: submission?.id || `pending_${student.id}`,
        submissionId: submission?.id || null,
        studentId: student.id,
        nama: student.namaLengkap || student.user?.nama || "-",
        nisn: student.nisn || "-",
        status: submission?.status || "NOT_STARTED",
        nilai: submission?.nilai !== undefined && submission?.nilai !== null ? Number(submission.nilai) : null,
        waktuMulai: submission?.waktuMulai || null,
        waktuKumpul: submission?.waktuKumpul || null,
        waktuDinilai: submission?.waktuDinilai || null,
        feedback: submission?.feedback || null,
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
