// /app/api/tutor/class-detail/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const classSubjectTutorId = searchParams.get("id");
  const user = await getUserFromCookie();

  if (!user || user.role !== "TUTOR") {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const detail = await prisma.classSubjectTutor.findUnique({
    where: { id: classSubjectTutorId || undefined },
    include: {
      class: {
        include: {
          academicYear: true,
          program: true,
          students: {
            include: {
              user: true,
              submissions: {
                include: {
                  assignment: true,
                  quiz: true,
                },
              },
            },
          },
        },
      },
      subject: true,
      tutor: true,
    },
  });

  const students = detail?.class?.students || [];

  const mapNilai = (jenis) =>
    students.map((s) => {
      const filtered = s.submissions.filter((sbm) => {
        const assignmentType = sbm.assignment?.jenis;
        if (jenis === "QUIZ") return !!sbm.quiz;
        return assignmentType === jenis;
      });
      const totalNilai =
        filtered.reduce((acc, sbm) => acc + (sbm.nilai || 0), 0) /
        (filtered.length || 1);
      return {
        id: s.id,
        nama: s.user?.nama,
        nilai: Math.round(totalNilai),
        nilaiRata: totalNilai.toFixed(1),
      };
    });

  return NextResponse.json({
    success: true,
    data: {
      ...detail,
      students: students.map((s) => ({
        id: s.id,
        nama: s.user?.nama,
      })),
      nilaiUTS: mapNilai("MIDTERM"),
      nilaiUAS: mapNilai("FINAL_EXAM"),
      nilaiKuis: mapNilai("QUIZ"),
      nilaiTugas: mapNilai("EXERCISE"),
    },
  });
}
