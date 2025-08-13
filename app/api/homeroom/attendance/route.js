import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan"));
    const tahun = parseInt(searchParams.get("tahun"));

    if (!bulan || !tahun) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bulan dan Tahun wajib diisi",
        }),
        { status: 400 }
      );
    }

    const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: {
          isActive: true,
        },
      },
      include: {
        students: {
          where: { status: "ACTIVE" },
          include: {
            Attendance: {
              where: {
                date: {
                  gte: new Date(tahun, bulan - 1, 1),
                  lte: new Date(tahun, bulan - 1, 31),
                },
              },
            },
          },
        },
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: kelas.students }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan") || "");
    const tahun = parseInt(searchParams.get("tahun") || "");

    if (!bulan || !tahun) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Bulan dan Tahun harus diisi",
        }),
        { status: 400 }
      );
    }

    // Cari tutor dari user
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Homeroom Teacher tidak ditemukan",
        }),
        { status: 404 }
      );
    }

    // Cari kelas aktif yang dipegang wali kelas
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: {
          isActive: true,
        },
      },
      include: { students: true },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const studentIds = kelas.students.map((s) => s.id);
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0); // hari terakhir bulan tsb

    // Hapus attendance lewat filter di AttendanceSession.tanggal
    const deletedAttendances = await prisma.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        AttendanceSession: { // relasi sesuai schema (huruf besar)
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
          classId: kelas.id,
        },
      },
    });

    // Hapus session presensi juga
    const deletedSessions = await prisma.attendanceSession.deleteMany({
      where: {
        classId: kelas.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Berhasil menghapus ${deletedAttendances.count} presensi dan ${deletedSessions.count} sesi di bulan ${bulan}/${tahun}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /homeroom/attendance error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
