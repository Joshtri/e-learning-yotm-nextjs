// import { prisma } from "@/lib/prisma";

import prisma from "./prisma";

/**
 * Helper to get daily attendance statuses
 */
async function getDailyAttendanceStatuses(studentId, academicYearId, classId) {
  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      attendanceSession: {
        classId,
        academicYearId,
      },
    },
    include: {
      attendanceSession: {
        select: {
          tanggal: true,
        },
      },
    },
  });

  if (attendances.length === 0) return [];

  // Group by Date (YYYY-MM-DD)
  const groupedByDate = attendances.reduce((acc, att) => {
    const dateStr = new Date(att.attendanceSession.tanggal)
      .toISOString()
      .split("T")[0];
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(att.status);
    return acc;
  }, {});

  // Determine Daily Status based on priority: ABSENT > SICK > EXCUSED > PRESENT
  const dailyStatuses = Object.values(groupedByDate).map((statuses) => {
    if (statuses.includes("ABSENT")) return "ABSENT";
    if (statuses.includes("SICK")) return "SICK";
    if (statuses.includes("EXCUSED")) return "EXCUSED";
    return "PRESENT";
  });

  return dailyStatuses;
}

/**
 * Menghitung ringkasan kehadiran (Count per Status)
 * @returns {Promise<{ PRESENT: number, SICK: number, EXCUSED: number, ABSENT: number, TOTAL_DAYS: number }>}
 */
export async function getStudentAttendanceSummary(
  studentId,
  academicYearId,
  classId
) {
  try {
    const dailyStatuses = await getDailyAttendanceStatuses(
      studentId,
      academicYearId,
      classId
    );

    const summary = dailyStatuses.reduce(
      (acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        acc.TOTAL_DAYS++;
        return acc;
      },
      { PRESENT: 0, SICK: 0, EXCUSED: 0, ABSENT: 0, TOTAL_DAYS: 0 }
    );

    return summary;
  } catch (error) {
    console.error("Error calculating attendance summary:", error);
    return { PRESENT: 0, SICK: 0, EXCUSED: 0, ABSENT: 0, TOTAL_DAYS: 0 };
  }
}

/**
 * Menghitung persentase kehadiran siswa berdasarkan data Attendance Harian
 * @returns {Promise<number>} Persentase kehadiran (0-100)
 */
export async function calculateAttendancePercentage(
  studentId,
  academicYearId,
  classId
) {
  try {
    const dailyStatuses = await getDailyAttendanceStatuses(
      studentId,
      academicYearId,
      classId
    );

    if (dailyStatuses.length === 0) {
      return 0;
    }

    // Hitung total kehadiran (Hadir Harian)
    const presentCount = dailyStatuses.filter((s) => s === "PRESENT").length;

    // Hitung persentase
    const percentage = (presentCount / dailyStatuses.length) * 100;

    return Math.round(percentage * 100) / 100;
  } catch (error) {
    console.error("Error calculating attendance percentage:", error);
    return 0;
  }
}

/**
 * Menghitung skor kehadiran dalam skala 0-100
 * dengan bobot: PRESENT = 100, SICK = 75, EXCUSED = 50, ABSENT = 0
 * Berbasis HARIAN (bukan per sesi)
 *
 * @returns {Promise<number>} Skor kehadiran (0-100)
 */
export async function calculateAttendanceScore(
  studentId,
  academicYearId,
  classId
) {
  try {
    const dailyStatuses = await getDailyAttendanceStatuses(
      studentId,
      academicYearId,
      classId
    );

    if (dailyStatuses.length === 0) {
      return 0;
    }

    // Bobot untuk setiap status
    const weights = {
      PRESENT: 100,
      SICK: 75,
      EXCUSED: 50,
      ABSENT: 0,
    };

    // Hitung total skor
    const totalScore = dailyStatuses.reduce((sum, status) => {
      return sum + (weights[status] || 0);
    }, 0);

    // Hitung rata-rata skor
    const averageScore = totalScore / dailyStatuses.length;

    return Math.round(averageScore * 100) / 100;
  } catch (error) {
    console.error("Error calculating attendance score:", error);
    return 0;
  }
}
