// import { prisma } from "@/lib/prisma";

import prisma from "./prisma";

/**
 * Menghitung persentase kehadiran siswa berdasarkan data Attendance
 * untuk tahun ajaran tertentu
 *
 * @param {string} studentId - ID siswa
 * @param {string} academicYearId - ID tahun ajaran
 * @param {string} classId - ID kelas
 * @returns {Promise<number>} Persentase kehadiran (0-100)
 */
export async function calculateAttendancePercentage(studentId, academicYearId, classId) {
  try {
    // Ambil semua data attendance siswa untuk tahun ajaran dan kelas tertentu
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId,
        academicYearId,
        classId,
      },
      select: {
        status: true,
      },
    });

    // Jika tidak ada data attendance, return 0
    if (attendances.length === 0) {
      return 0;
    }

    // Hitung total kehadiran
    const presentCount = attendances.filter(
      (att) => att.status === "PRESENT"
    ).length;

    // Hitung persentase
    const percentage = (presentCount / attendances.length) * 100;

    // Return dengan 2 desimal
    return Math.round(percentage * 100) / 100;
  } catch (error) {
    console.error("Error calculating attendance percentage:", error);
    return 0;
  }
}

/**
 * Menghitung skor kehadiran dalam skala 0-100
 * dengan bobot: PRESENT = 100, SICK = 75, EXCUSED = 50, ABSENT = 0
 *
 * @param {string} studentId - ID siswa
 * @param {string} academicYearId - ID tahun ajaran
 * @param {string} classId - ID kelas
 * @returns {Promise<number>} Skor kehadiran (0-100)
 */
export async function calculateAttendanceScore(studentId, academicYearId, classId) {
  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId,
        academicYearId,
        classId,
      },
      select: {
        status: true,
      },
    });

    if (attendances.length === 0) {
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
    const totalScore = attendances.reduce((sum, att) => {
      return sum + (weights[att.status] || 0);
    }, 0);

    // Hitung rata-rata skor
    const averageScore = totalScore / attendances.length;

    // Return dengan 2 desimal
    return Math.round(averageScore * 100) / 100;
  } catch (error) {
    console.error("Error calculating attendance score:", error);
    return 0;
  }
}
