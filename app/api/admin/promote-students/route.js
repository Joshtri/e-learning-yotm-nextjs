// File: app/api/admin/promote-students/route.js


import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const students = await prisma.student.findMany({
      where: {
        naikKelas: true,
        diprosesNaik: false,
        status: "ACTIVE",
      },
      include: {
        user: true,
        class: true,
        FinalScore: {
          include: { subject: true },
        },
        Attendance: true,
      },
      orderBy: { namaLengkap: "asc" },
    });

    const result = students.map((student) => {
      const count = { PRESENT: 0, SICK: 0, EXCUSED: 0, ABSENT: 0 };
      student.Attendance.forEach((a) => {
        if (a.status in count) count[a.status]++;
      });
      const total = student.Attendance.length;

      const avgNilai = student.FinalScore.length
        ? student.FinalScore.map((f) => f.nilaiAkhir).reduce(
            (a, b) => a + b,
            0
          ) / student.FinalScore.length
        : 0;

      return {
        ...student,
        nilaiAkhir: Number(avgNilai.toFixed(2)),
        attendanceSummary: {
          hadir: count.PRESENT,
          sakit: count.SICK,
          izin: count.EXCUSED,
          alpa: count.ABSENT,
          persen: total ? (count.PRESENT / total) * 100 : 0,
        },
      };
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
    });
  } catch (error) {
    console.error("[ERROR GET PROMOTE STUDENTS]", error);
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
