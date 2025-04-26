import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        namaLengkap: true,
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
              },
            },
            students: {
              select: {
                id: true,
                namaLengkap: true,
                user: { select: { email: true } },
              },
            },
            classSubjectTutors: {
              select: {
                id: true,
                subject: { select: { id: true, namaMapel: true } },
              },
            },
          },
        },
      },
    });

    if (!student?.class) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Siswa belum terdaftar di kelas",
        }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: student.class }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal GET kelas siswa:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data kelas" }),
      { status: 500 }
    );
  }
}
