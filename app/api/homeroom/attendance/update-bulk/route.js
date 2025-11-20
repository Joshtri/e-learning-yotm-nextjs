import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { attendances, academicYearId } = await req.json();

    if (!attendances || !Array.isArray(attendances) || attendances.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data presensi untuk diperbarui" },
        { status: 400 }
      );
    }

    // Verify tutor has access to this class
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Verify that the tutor has a class for this academic year
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYearId: academicYearId,
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan untuk tahun ajaran ini" },
        { status: 404 }
      );
    }

    // Update all attendances in transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let successCount = 0;
        const errors = [];

        for (const attendance of attendances) {
          try {
            // Verify attendance belongs to this class
            const existingAttendance = await tx.attendance.findUnique({
              where: { id: attendance.attendanceId },
            });

            if (!existingAttendance) {
              errors.push(`Presensi ${attendance.attendanceId} tidak ditemukan`);
              continue;
            }

            if (existingAttendance.classId !== kelas.id) {
              errors.push(`Presensi ${attendance.attendanceId} tidak termasuk dalam kelas ini`);
              continue;
            }

            // Update the attendance
            await tx.attendance.update({
              where: { id: attendance.attendanceId },
              data: {
                status: attendance.status,
              },
            });

            successCount++;
          } catch (error) {
            errors.push(`Error updating ${attendance.attendanceId}: ${error.message}`);
          }
        }

        return { successCount, errors };
      },
      { timeout: 180000 }
    );

    return NextResponse.json({
      success: true,
      message: `${result.successCount} presensi berhasil diperbarui`,
      data: {
        updatedCount: result.successCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("PATCH /homeroom/attendance/update-bulk error:", error);
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
