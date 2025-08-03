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
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    if (!classId || !subjectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "classId dan subjectId wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Validasi tutor mengajar mapel ini
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor tidak ditemukan" }),
        { status: 404 }
      );
    }

    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        tutorId: tutor.id,
        classId,
        subjectId,
      },
    });

    if (!classSubjectTutor) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Anda tidak mengajar kelas atau mapel ini",
        }),
        { status: 403 }
      );
    }

    // Ambil semua siswa yang aktif di kelas tersebut
    const students = await prisma.student.findMany({
      where: {
        classId: classId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        namaLengkap: true,
        SkillScore: {
          where: { subjectId },
          select: { nilai: true },
        },
      },
      orderBy: {
        namaLengkap: "asc",
      },
    });

    const formattedStudents = students.map((s) => ({
      id: s.id,
      namaLengkap: s.namaLengkap,
      nilai: s.SkillScore[0]?.nilai ?? null, // ambil nilai jika sudah ada
    }));

    return new Response(
      JSON.stringify({ success: true, data: formattedStudents }),
      {
        status: 200,
      }
    );

    return new Response(JSON.stringify({ success: true, data: students }), {
      status: 200,
    });
  } catch (error) {
    console.error("[ERROR GET SKILL SCORES STUDENTS]", error);
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
