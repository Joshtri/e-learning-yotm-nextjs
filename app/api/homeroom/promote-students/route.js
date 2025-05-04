// File: app/api/homeroom/promote-students/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function PATCH(req) {
  try {
    const user = getUserFromCookie();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await req.json();
    const { promotions } = body;

    if (!Array.isArray(promotions)) {
      return new Response(
        JSON.stringify({ success: false, message: "Data tidak valid" }),
        { status: 400 }
      );
    }

    // Cari tutor tanpa cek role
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor tidak ditemukan" }),
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

    // Simpan promosi siswa
    await prisma.$transaction(
      promotions.map((item) =>
        prisma.student.update({
          where: { id: item.studentId },
          data: {
            naikKelas: item.naikKelas,
            diprosesNaik: false,
          },
        })
      )
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Promosi siswa berhasil disimpan",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR PROMOTE STUDENTS]", error);
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
