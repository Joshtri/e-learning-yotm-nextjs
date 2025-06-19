// app/api/homeroom/recalculate-final-scores/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth"; // ⬅️ pakai ini

export async function GET() {
  try {
    const user = await getUserFromCookie();

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
      where: { homeroomTeacherId: tutor.id },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const students = await prisma.student.findMany({
      where: { classId: kelas.id },
      include: {
        SkillScore: {
          include: { subject: true },
        },
        user: true,
      },
    });

    const programSubjects = await prisma.programSubject.findMany({
      where: { programId: kelas.programId },
      include: { subject: true },
    });

    const mapelList = programSubjects.map((ps) => ps.subject.namaMapel);

    const result = students.map((student) => {
      const nilaiPerMapel = mapelList.map((mapel) => {
        const skill = student.SkillScore.find(
          (sk) => sk.subject.namaMapel === mapel
        );
        return {
          mapel,
          nilai: skill ? skill.nilai : null,
        };
      });

      const nilaiTersedia = nilaiPerMapel
        .filter((n) => n.nilai !== null)
        .map((n) => n.nilai);

      const nilaiAkhir =
        nilaiTersedia.length > 0
          ? nilaiTersedia.reduce((acc, val) => acc + val, 0) /
            nilaiTersedia.length
          : null;

      return {
        id: student.id,
        namaLengkap: student.namaLengkap,
        nilaiPerMapel,
        nilaiAkhir:
          nilaiAkhir !== null ? parseFloat(nilaiAkhir.toFixed(2)) : null,
      };
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching final scores:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const user = getUserFromCookie();

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
      where: { homeroomTeacherId: tutor.id },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    const students = await prisma.student.findMany({
      where: { classId: kelas.id },
      include: {
        SkillScore: {
          include: { subject: true },
        },
      },
    });

    const programSubjects = await prisma.programSubject.findMany({
      where: { programId: kelas.programId },
      include: { subject: true },
    });

    const mapelList = programSubjects.map((ps) => ps.subject.namaMapel);

    const updates = [];

    for (const student of students) {
      const nilaiPerMapel = mapelList.map((mapel) => {
        const skill = student.SkillScore.find(
          (sk) => sk.subject.namaMapel === mapel
        );
        return {
          mapel,
          nilai: skill ? skill.nilai : null,
        };
      });

      const nilaiTersedia = nilaiPerMapel
        .filter((n) => n.nilai !== null)
        .map((n) => n.nilai);

      const nilaiAkhir =
        nilaiTersedia.length > 0
          ? nilaiTersedia.reduce((acc, val) => acc + val, 0) /
            nilaiTersedia.length
          : null;

      if (nilaiAkhir !== null) {
        updates.push({
          studentId: student.id,
          nilaiAkhir: parseFloat(nilaiAkhir.toFixed(2)),
        });
      }
    }

    // Upsert ke StudentClassHistory
    for (const update of updates) {
      await prisma.studentClassHistory.upsert({
        where: {
          studentId_classId_academicYearId: {
            studentId: update.studentId,
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
          },
        },
        update: {
          nilaiAkhir: update.nilaiAkhir,
        },
        create: {
          studentId: update.studentId,
          classId: kelas.id,
          academicYearId: kelas.academicYearId,
          nilaiAkhir: update.nilaiAkhir,
          naikKelas: false,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Nilai akhir berhasil dihitung ulang.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recalculating final scores:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
