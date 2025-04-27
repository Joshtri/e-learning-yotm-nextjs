// app/api/homeroom/about-class/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
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
      include: {
        program: true,
        academicYear: true,
        homeroomTeacher: {
          include: { user: true },
        },
        students: {
          include: {
            user: true,
          },
        },
        classSubjectTutors: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Class not found" }),
        { status: 404 }
      );
    }

    const students = kelas.students.map((student) => ({
      id: student.id,
      namaLengkap: student.namaLengkap,
      nisn: student.nisn,
      jenisKelamin: student.jenisKelamin,
      status: student.status,
    }));

    const subjects = kelas.classSubjectTutors.map((cst) => ({
      id: cst.subject.id,
      namaMapel: cst.subject.namaMapel,
      kodeMapel: cst.subject.kodeMapel,
    }));

    const data = {
      namaKelas: kelas.namaKelas,
      program: { namaPaket: kelas.program.namaPaket },
      academicYear: {
        tahunMulai: kelas.academicYear.tahunMulai,
        tahunSelesai: kelas.academicYear.tahunSelesai,
      },
      homeroomTeacher: { namaLengkap: kelas.homeroomTeacher.namaLengkap },
      students,
      subjects,
    };

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
    });
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
