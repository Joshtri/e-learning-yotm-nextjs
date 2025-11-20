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

    // 🔥 Cari kelas yang dipegang sebagai wali kelas
    const allClasses = await prisma.class.findMany({
      where: {
        homeroomTeacherId: tutor.id,
      },
      include: {
        students: {
          where: { status: "ACTIVE" },
        },
        academicYear: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
    });

    if (!allClasses || allClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalClasses: 0,
          totalActiveStudents: 0,
          attendanceRate: 0,
          assignmentCompletion: 0,
        },
      });
    }

    // Pilih kelas yang punya siswa aktif
    let kelas = allClasses.find((cls) => cls.students.length > 0);
    if (!kelas) {
      kelas = allClasses[0];
    }

    const studentIds = kelas.students.map((s) => s.id);

    // 🔥 Hitung statistik
    const totalClasses = allClasses.length;
    const totalActiveStudents = kelas.students.length;

    // Hitung attendance rate
    const totalAttendanceRecords = await prisma.attendance.count({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId,
      },
    });

    const expectedAttendanceRecords = studentIds.length * 20; // Assume 20 sessions per semester
    const attendanceRate =
      expectedAttendanceRecords > 0
        ? parseFloat(
            ((totalAttendanceRecords / expectedAttendanceRecords) * 100).toFixed(2)
          )
        : 0;

    // Hitung assignment completion rate
    const totalAssignments = await prisma.assignment.count({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
      },
    });

    const completedSubmissions = await prisma.submission.count({
      where: {
        assignment: {
          classSubjectTutor: {
            classId: kelas.id,
          },
        },
      },
    });

    const expectedSubmissions = studentIds.length * (totalAssignments || 1);
    const assignmentCompletion =
      expectedSubmissions > 0
        ? parseFloat(
            ((completedSubmissions / expectedSubmissions) * 100).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      success: true,
      totalClasses,
      totalActiveStudents,
      attendanceRate,
      assignmentCompletion,
    });
  } catch (error) {
    console.error("Gagal memuat stats dashboard wali kelas:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat stats." },
      { status: 500 }
    );
  }
}
