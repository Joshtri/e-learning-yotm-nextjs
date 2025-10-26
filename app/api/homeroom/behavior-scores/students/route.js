// File: /app/api/homeroom/behavior-scores/students/route.js

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { calculateAttendanceScore } from "@/lib/attendance-calculator";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "Parameter classId diperlukan" },
        { status: 400 }
      );
    }

    const kelas = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        academicYearId: true,
        namaKelas: true,
        academicYear: {
          select: {
            id: true,
            tahunMulai: true,
            tahunSelesai: true,
            semester: true,
          },
        },
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    const academicYearId = kelas.academicYearId;

    // First, get all students who have behavior scores for this class and academic year (historical data)
    const historicalBehaviorScores = await prisma.behaviorScore.findMany({
      where: {
        classId,
        academicYearId,
      },
      select: {
        studentId: true,
      },
    });

    const historicalStudentIds = historicalBehaviorScores.map(bs => bs.studentId);

    // Get current active students OR students who had behavior scores (historical)
    const students = await prisma.student.findMany({
      where: {
        classId,
        OR: [
          { status: "ACTIVE" }, // Current active students
          { id: { in: historicalStudentIds } }, // Historical students with behavior scores
        ],
      },
      select: {
        id: true,
        namaLengkap: true,
        nisn: true,
        status: true,
        BehaviorScore: {
          where: {
            academicYearId,
            classId,
          },
          select: {
            spiritual: true,
            sosial: true,
            kehadiran: true,
            catatan: true,
          },
        },
      },
      orderBy: {
        namaLengkap: "asc",
      },
    });

    // Calculate attendance for each student
    const data = await Promise.all(
      students.map(async (s) => {
        // Auto-calculate kehadiran
        const kehadiran = await calculateAttendanceScore(
          s.id,
          academicYearId,
          classId
        );

        return {
          id: s.id,
          namaLengkap: s.namaLengkap,
          behaviorScore: s.BehaviorScore[0],
          academicYearId,
          autoCalculatedKehadiran: kehadiran, // Send auto-calculated value
        };
      })
    );

    return NextResponse.json({
      success: true,
      data,
      academicYearInfo: {
        id: kelas.academicYear.id,
        tahunAjaran: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
        semester: kelas.academicYear.semester,
        keterangan:
          kelas.academicYear.semester === "GENAP"
            ? "Semester Genap - Digunakan untuk kenaikan kelas"
            : "Semester Ganjil",
      },
      kehadiranInfo: {
        keterangan:
          "Nilai kehadiran dihitung otomatis dari data absensi siswa sepanjang tahun ajaran ini",
        rumus: "Bobot: PRESENT=100, SICK=75, EXCUSED=50, ABSENT=0",
      },
    });
  } catch (error) {
    console.error("Gagal mengambil siswa untuk behavior score:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
