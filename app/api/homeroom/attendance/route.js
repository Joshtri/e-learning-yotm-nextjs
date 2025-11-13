import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan"));
    const tahun = parseInt(searchParams.get("tahun"));
    const academicYearId = searchParams.get("academicYearId"); // ✅ Optional filter

    if (!bulan || !tahun) {
      return NextResponse.json(
        {
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        },
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    const getStartDate = new Date(tahun, bulan - 1, 1);
    const getEndDate = new Date(tahun, bulan, 0);

    console.log("DEBUG GET - bulan:", bulan, "tahun:", tahun);
    console.log("DEBUG GET - startDate:", getStartDate);
    console.log("DEBUG GET - endDate:", getEndDate);

    // Step 1: Get the homeroom class
    // If academicYearId is provided, get class for that specific year
    // Otherwise, get the latest class
    const whereCondition = {
      homeroomTeacherId: tutor.id,
    };

    if (academicYearId) {
      whereCondition.academicYearId = academicYearId;
    }

    const kelas = await prisma.class.findFirst({
      where: whereCondition,
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
      include: {
        academicYear: true,
      },
    });

    if (!kelas) {
      // If no class is assigned to the homeroom teacher at all, return empty.
      return NextResponse.json({ success: true, data: [] });
    }

    console.log("DEBUG GET - Class found:", kelas.namaKelas, "Academic Year:", kelas.academicYear?.tahunMulai);
    console.log("DEBUG GET - Is Active:", kelas.academicYear?.isActive);

    let studentsWithAttendance = [];

    // Step 2: Get students based on whether viewing active or historical academic year
    if (kelas.academicYear.isActive) {
      // ✅ ACTIVE YEAR: Get current students from Class.students
      console.log("DEBUG GET - Using current students from Class");
      studentsWithAttendance = await prisma.student.findMany({
        where: {
          classId: kelas.id,
          status: "ACTIVE",
        },
        include: {
          Attendance: {
            where: {
              classId: kelas.id,
              academicYearId: kelas.academicYearId,
              date: {
                gte: getStartDate,
                lte: getEndDate,
              },
            },
            include: {
              academicYear: true,
            },
          },
        },
      });
    } else {
      // ✅ HISTORICAL YEAR: Get students from StudentClassHistory
      console.log("DEBUG GET - Using historical students from StudentClassHistory");
      const studentHistories = await prisma.studentClassHistory.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
        },
        include: {
          student: {
            include: {
              Attendance: {
                where: {
                  classId: kelas.id,
                  academicYearId: kelas.academicYearId,
                  date: {
                    gte: getStartDate,
                    lte: getEndDate,
                  },
                },
                include: {
                  academicYear: true,
                },
              },
            },
          },
        },
      });

      // Transform to match the same structure as current students
      studentsWithAttendance = studentHistories.map((history) => history.student);
    }

    console.log("DEBUG GET - Students found:", studentsWithAttendance.length);

    // Debug: Count total attendances found
    const totalAttendances = studentsWithAttendance.reduce((sum, student) => sum + student.Attendance.length, 0);
    console.log("DEBUG GET - Total attendances found:", totalAttendances);
    console.log("DEBUG GET - Academic Year:", kelas.academicYear?.tahunMulai, "/", kelas.academicYear?.tahunSelesai, kelas.academicYear?.semester);

    // Pass academic year info along with the students
    const responseData = {
        students: studentsWithAttendance,
        academicYearInfo: kelas.academicYear
    }

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error(error);
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

export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan") || "");
    const tahun = parseInt(searchParams.get("tahun") || "");
    const academicYearId = searchParams.get("academicYearId"); // ✅ Optional filter

    if (!bulan || !tahun) {
      return NextResponse.json(
        {
          success: false,
          message: "Bulan dan Tahun harus diisi",
        },
        { status: 400 }
      );
    }

    // Cari tutor dari user
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        {
          success: false,
          message: "Homeroom Teacher tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Cari kelas yang dipegang wali kelas
    // If academicYearId is provided, get class for that specific year
    const whereConditionDelete = {
      homeroomTeacherId: tutor.id,
    };

    if (academicYearId) {
      whereConditionDelete.academicYearId = academicYearId;
    }

    const kelas = await prisma.class.findFirst({
      where: whereConditionDelete,
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } },
      ],
      include: {
        students: { where: { status: "ACTIVE" } },
        academicYear: true
      },
    });

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("DEBUG Delete - Class found:", kelas.namaKelas, "Academic Year:", kelas.academicYear?.tahunMulai);
    console.log("DEBUG Delete - Is Active:", kelas.academicYear?.isActive);

    // Get student IDs based on whether it's active or historical academic year
    let studentIds = [];

    if (kelas.academicYear.isActive) {
      // ✅ ACTIVE YEAR: Get current students
      console.log("DEBUG Delete - Using current students from Class");
      studentIds = kelas.students.map((s) => s.id);
    } else {
      // ✅ HISTORICAL YEAR: Get students from StudentClassHistory
      console.log("DEBUG Delete - Using historical students from StudentClassHistory");
      const studentHistories = await prisma.studentClassHistory.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
        },
        select: {
          studentId: true,
        },
      });
      studentIds = studentHistories.map((h) => h.studentId);
    }

    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999); // hari terakhir bulan + waktu

    console.log("DEBUG Delete - classId:", kelas.id);
    console.log("DEBUG Delete - academicYearId:", kelas.academicYearId);
    console.log("DEBUG Delete - studentIds count:", studentIds.length);
    console.log("DEBUG Delete - startDate:", startDate);
    console.log("DEBUG Delete - endDate:", endDate);

    // Langkah 3: Hapus attendance terlebih dahulu (karena foreign key)
    const deletedAttendances = await prisma.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        classId: kelas.id,
        academicYearId: kelas.academicYearId, // ✅ Filter by academic year
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Deleted attendances count:", deletedAttendances.count);

    // Langkah 4: Hapus session presensi SETELAH attendance (karena ada foreign key reference)
    const deletedSessions = await prisma.attendanceSession.deleteMany({
      where: {
        classId: kelas.id,
        academicYearId: kelas.academicYearId, // ✅ Filter by academic year
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    console.log("DEBUG - Deleted sessions count:", deletedSessions.count);

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deletedAttendances.count} data presensi dan ${deletedSessions.count} session di bulan ${bulan}/${tahun} untuk T.A ${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
    });

  } catch (error) {
    console.error("DELETE /homeroom/attendance error:", error);
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
