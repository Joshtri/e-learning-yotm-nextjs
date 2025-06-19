// app/api/homeroom/my-students/route.js

import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth"; // ganti dari getAuthUser ke getUserFromCookie

export async function GET(req) {
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
      where: {
        homeroomTeacherId: tutor.id,
        academicYear: {
          isActive: true,
        },
      },
      include: {
        students: {
          include: {
            user: true,
          },
        },
      },
    });
    

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: kelas.students }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET My Students]", error);
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
