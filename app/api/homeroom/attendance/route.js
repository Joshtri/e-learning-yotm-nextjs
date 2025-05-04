import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  try {
    const user = getUserFromCookie();
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
    const user = getUserFromCookie();
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
          message: "Bulan dan Tahun harus diisi",
        }),
        { status: 400 }
      );
    }

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

    // const kelas = await prisma.class.findFirst({
    //   where: { homeroomTeacherId: tutor.id },
    // });

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

    const deleted = await prisma.attendance.deleteMany({
      where: {
        studentId: { in: studentIds },
        date: {
          gte: new Date(tahun, bulan - 1, 1),
          lte: new Date(tahun, bulan - 1, 31),
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Berhasil menghapus ${deleted.count} presensi di bulan ${bulan}/${tahun}`,
      }),
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
