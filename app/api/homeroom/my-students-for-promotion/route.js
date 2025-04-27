// app/api/homeroom/my-students-for-promotion/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth"; // kamu bilang pakai ini ya

export async function GET() {
    try {
      const user = getUserFromCookie();
  
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { status: 401 }
        );
      }
  
      // Cari tutor berdasarkan user yang login
      const tutor = await prisma.tutor.findUnique({
        where: { userId: user.id },
      });
  
      if (!tutor) {
        return new Response(
          JSON.stringify({ success: false, message: "Tutor not found" }),
          { status: 404 }
        );
      }
  
      // Cari kelas di mana tutor ini jadi wali kelas
      const kelas = await prisma.class.findFirst({
        where: { homeroomTeacherId: tutor.id },
      });
  
      if (!kelas) {
        return new Response(
          JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
          { status: 404 }
        );
      }
  
      // Cari semua siswa di kelas ini
      const students = await prisma.student.findMany({
        where: { classId: kelas.id },
        include: {
          user: true, // ambil relasi ke tabel User
        },
        orderBy: {
          namaLengkap: "asc",
        },
      });
  
      return new Response(
        JSON.stringify({
          success: true,
          data: students,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching homeroom students:", error);
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