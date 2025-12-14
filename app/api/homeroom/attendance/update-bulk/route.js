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

    // Verify tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Verify Class
    const whereCondition = {
      homeroomTeacherId: tutor.id // Only Homeroom teacher can update?
      // User Says: "Guru/Wali Kelas". But homeroom/attendance implies Homeroom view.
      // For now stick to Homeroom validation.
    };
    if (academicYearId) whereCondition.academicYearId = academicYearId;

    const kelas = await prisma.class.findFirst({
      where: whereCondition,
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update Transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let successCount = 0;
        const errors = [];

        for (const updateData of attendances) {
          try {
            // Check if this is a new record (temp ID or missing ID)
            const isNew =
              !updateData.attendanceId ||
              String(updateData.attendanceId).startsWith("temp-");

            if (isNew) {
              // Creation / Upsert Logic
              if (!updateData.sessionId || !updateData.studentId) {
                errors.push(
                  `Gagal: Session ID dan Student ID diperlukan untuk data baru`
                );
                continue;
              }

              // Validate Session Ownership
              const sessionCheck = await tx.attendanceSession.findUnique({
                where: { id: updateData.sessionId },
                select: { classId: true },
              });

              if (!sessionCheck || sessionCheck.classId !== kelas.id) {
                errors.push(
                  `Session ${updateData.sessionId} tidak valid untuk kelas ini`
                );
                continue;
              }

              // Manual Upsert to prevent duplicates
              const existing = await tx.attendance.findFirst({
                where: {
                  attendanceSessionId: updateData.sessionId, // Correct field name
                  studentId: updateData.studentId,
                },
              });

              if (existing) {
                await tx.attendance.update({
                  where: { id: existing.id },
                  data: {
                    status: updateData.status,
                    note: updateData.note,
                  },
                });
              } else {
                await tx.attendance.create({
                  data: {
                    attendanceSessionId: updateData.sessionId, // Correct field name
                    studentId: updateData.studentId,
                    status: updateData.status,
                    note: updateData.note,
                    classId: kelas.id,
                    academicYearId: kelas.academicYearId,
                  },
                });
              }
            } else {
              // Standard Update Logic for existing IDs
              const existing = await tx.attendance.findUnique({
                where: { id: updateData.attendanceId },
                include: { attendanceSession: true },
              });

              if (!existing) {
                errors.push(
                  `Presensi ${updateData.attendanceId} tidak ditemukan`
                );
                continue;
              }

              if (existing.attendanceSession.classId !== kelas.id) {
                errors.push(
                  `Presensi ${updateData.attendanceId} bukan milik kelas ini`
                );
                continue;
              }

              await tx.attendance.update({
                where: { id: updateData.attendanceId },
                data: {
                  status: updateData.status,
                  note: updateData.note,
                },
              });
            }
            successCount++;
          } catch (err) {
            errors.push(
              `Gagal proses ${updateData.studentId || updateData.attendanceId
              }: ${err.message}`
            );
          }
        }
        return { successCount, errors };
      },
      { timeout: 30000 }
    );

    return NextResponse.json({
      success: true,
      message: `${result.successCount} presensi berhasil disimpan`,
      data: result
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
