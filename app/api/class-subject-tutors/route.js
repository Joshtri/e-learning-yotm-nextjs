import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    let role = null;
    let userId = null;
    let tutorId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        role = decoded.role;
        userId = decoded.id;

        if (role === "TUTOR") {
          const tutor = await prisma.tutor.findUnique({
            where: { userId },
            select: { id: true },
          });

          if (!tutor) {
            return new Response(
              JSON.stringify({ success: false, message: "Tutor not found" }),
              { status: 404 }
            );
          }

          tutorId = tutor.id;
        }
      } catch (err) {
        console.error("JWT verification failed", err);
        return new Response(
          JSON.stringify({ success: false, message: "Invalid token" }),
          { status: 401 }
        );
      }
    }

    const where = {
      ...(tutorId && { tutorId }), // filter hanya kalau TUTOR
      ...(academicYearId && { class: { academicYearId } }),
    };

    const data = await prisma.classSubjectTutor.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            namaKelas: true,
            academicYear: {
              select: {
                id: true,
                tahunMulai: true,
                tahunSelesai: true,
              },
            },
            program: {
              select: {
                id: true,
                namaPaket: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            namaMapel: true,
          },
        },
        tutor: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Gagal GET jadwal:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data" }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { tutorId, classId, subjectId } = await request.json();

    if (!tutorId || !classId || !subjectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Semua field wajib diisi",
        }),
        { status: 400 }
      );
    }

    const exists = await prisma.classSubjectTutor.findFirst({
      where: { tutorId, classId, subjectId },
    });

    if (exists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Jadwal ini sudah terdaftar",
        }),
        { status: 409 }
      );
    }

    const created = await prisma.classSubjectTutor.create({
      data: { tutorId, classId, subjectId },
    });

    return Response.json(
      { success: true, data: created, message: "Jadwal berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Gagal POST jadwal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menyimpan data",
      }),
      { status: 500 }
    );
  }
}
