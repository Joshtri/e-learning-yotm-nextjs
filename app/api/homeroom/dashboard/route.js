import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 Cari tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // 🔥 Cari kelas yang dipegang sebagai wali kelas (homeroom teacher)
    const kelas = await prisma.class.findFirst({
      where: { homeroomTeacherId: tutor.id },
      include: {
        students: {
          where: { status: "ACTIVE" },
          include: {
            submissions: true, // Untuk rata-rata nilai
          },
        },
        academicYear: true,
      },
    });

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Kelas tidak ditemukan untuk wali kelas ini.",
        },
        { status: 404 }
      );
    }

    const { students } = kelas;

    // 🔥 Hitung total students
    const totalStudents = students.length;

    // 🔥 Hitung total presensi siswa di kelas ini
    const totalAttendances = await prisma.attendance.count({
      where: {
        classId: kelas.id,
      },
    });

    // 🔥 Hitung total assignments
    const totalAssignments = await prisma.assignment.count({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
      },
    });

    // 🔥 Hitung rata-rata nilai siswa
    const allScores = [];
    students.forEach((student) => {
      student.submissions.forEach((submission) => {
        if (submission.nilai !== null) {
          allScores.push(submission.nilai);
        }
      });
    });

    const averageScore =
      allScores.length > 0
        ? parseFloat(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        totalAttendances,
        totalAssignments,
        averageScore,
      },
    });
  } catch (error) {
    console.error("Gagal memuat dashboard wali kelas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat dashboard." },
      { status: 500 }
    );
  }
}
