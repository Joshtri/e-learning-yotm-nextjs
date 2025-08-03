// File: app/api/tutor/skill-scores/submit/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { classId, subjectId, scores } = body;

    if (!classId || !subjectId || !Array.isArray(scores)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "classId, subjectId, dan scores wajib diisi",
        }),
        { status: 400 }
      );
    }

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

    const createData = scores.map((item) => ({
      studentId: item.studentId,
      subjectId: subjectId,
      nilai: item.nilai,
      keterangan: item.keterangan || null,
    }));

    // Check existing skill scores to prevent duplicates
    // const existing = await prisma.skillScore.findMany({
    //   where: {
    //     studentId: { in: scores.map((s) => s.studentId) },
    //     subjectId: subjectId,
    //   },
    // });

    // if (existing.length > 0) {
    //   return new Response(
    //     JSON.stringify({
    //       success: false,
    //       message: "Beberapa siswa sudah memiliki nilai skill di mapel ini.",
    //     }),
    //     { status: 400 }
    //   );
    // }

    // // Save new skill scores
    // await prisma.skillScore.createMany({
    //   data: createData,
    // });

    await prisma.$transaction(
      scores.map((item) =>
        prisma.skillScore.upsert({
          where: {
            studentId_subjectId: {
              studentId: item.studentId,
              subjectId: subjectId,
            },
          },
          update: {
            nilai: item.nilai,
            keterangan: item.keterangan || null,
          },
          create: {
            studentId: item.studentId,
            subjectId: subjectId,
            nilai: item.nilai,
            keterangan: item.keterangan || null,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Skill scores berhasil disimpan",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR POST SKILL SCORES]", error);
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
