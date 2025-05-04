import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth"; // ✅ kita pakai ini sesuai yang tadi

export async function GET(req) {
  try {
    const user = getUserFromCookie(); // ambil user login
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

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
          isActive: true, // ✅ filter tahun ajaran aktif
        },
      },
    });
    

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const studentsInClass = await prisma.student.findMany({
      where: { classId: kelas.id },
      select: { id: true },
    });

    const studentIds = studentsInClass.map((s) => s.id);

    if (studentIds.length === 0) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
      });
    }

    const academicScores = await prisma.skillScore.findMany({
      where: {
        student: {
          class: {
            academicYearId: kelas.academicYearId, // ✅ pastikan data nilai sesuai tahun ajaran kelas aktif
          },
        },
        studentId: { in: studentIds },
      },
      include: {
        student: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
        subject: {
          select: {
            id: true,
            namaMapel: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    

    return new Response(
      JSON.stringify({ success: true, data: academicScores }),
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
