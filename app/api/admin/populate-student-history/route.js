import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

/**
 * Utility endpoint to populate StudentClassHistory
 * This creates history records for all current students in all classes
 */
export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    // Get all classes with their students and academic year
    const classes = await prisma.class.findMany({
      include: {
        students: true,
        academicYear: true,
      },
    });

    console.log("Found classes:", classes.length);

    let created = 0;
    let skipped = 0;

    for (const kelas of classes) {
      console.log(`Processing class: ${kelas.namaKelas} (${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai} ${kelas.academicYear.semester})`);

      for (const student of kelas.students) {
        // Check if history record already exists
        const existing = await prisma.studentClassHistory.findFirst({
          where: {
            studentId: student.id,
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create history record
        await prisma.studentClassHistory.create({
          data: {
            studentId: student.id,
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
            naikKelas: false,
            nilaiAkhir: null,
          },
        });

        created++;
      }
    }

    console.log(`Created: ${created}, Skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      message: "StudentClassHistory populated successfully",
      summary: {
        created,
        skipped,
        total: created + skipped,
      },
    });
  } catch (error) {
    console.error("Error populating StudentClassHistory:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Get statistics about StudentClassHistory
 */
export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin only" },
        { status: 401 }
      );
    }

    const totalHistory = await prisma.studentClassHistory.count();
    const totalClasses = await prisma.class.count();
    const totalStudents = await prisma.student.count();

    // Get history by academic year
    const historyByYear = await prisma.studentClassHistory.groupBy({
      by: ["academicYearId"],
      _count: {
        id: true,
      },
    });

    // Get academic year details
    const academicYears = await prisma.academicYear.findMany({
      where: {
        id: {
          in: historyByYear.map((h) => h.academicYearId),
        },
      },
    });

    const yearDetails = historyByYear.map((h) => {
      const year = academicYears.find((y) => y.id === h.academicYearId);
      return {
        academicYearId: h.academicYearId,
        tahunMulai: year?.tahunMulai,
        tahunSelesai: year?.tahunSelesai,
        semester: year?.semester,
        isActive: year?.isActive,
        count: h._count.id,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalHistory,
        totalClasses,
        totalStudents,
        historyByYear: yearDetails,
      },
    });
  } catch (error) {
    console.error("Error getting StudentClassHistory stats:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
