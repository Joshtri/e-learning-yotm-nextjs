import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request, context) {
  try {
    const { id } = context.params;

    // 🔐 Auth check
    const { user, error, status } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    // 🔎 Ambil data Tutor + User + Relasi Pengajaran
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
            status: true,
          },
        },
        classSubjectTutors: {
          select: {
            id: true,
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
              },
            },
            subject: {
              select: {
                id: true,
                namaMapel: true,
                deskripsi: true,
              },
            },
          },
        },
      },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // 🔐 Hanya ADMIN atau tutor itu sendiri yang bisa lihat detail penuh
    const isSelfOrAdmin = user.role === "ADMIN" || user.id === tutor.user.id;

    // 🧩 Format relasi pengajaran
    const assignments = tutor.classSubjectTutors.map((entry) => ({
      id: entry.id,
      class: entry.class,
      subject: entry.subject,
    }));

    // 📦 Format final
    const formattedTutor = {
      id: tutor.id,
      user: tutor.user,
      namaLengkap: tutor.namaLengkap,
      bio: tutor.bio,
      fotoUrl: tutor.fotoUrl,
      assignments,
      pendidikan: isSelfOrAdmin ? tutor.pendidikan : undefined,
      pengalaman: isSelfOrAdmin ? tutor.pengalaman : undefined,
      telepon: isSelfOrAdmin ? tutor.telepon : undefined,
      createdAt: tutor.createdAt,
      updatedAt: tutor.updatedAt,
    };

    return NextResponse.json({ success: true, data: formattedTutor });
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tutor details" },
      { status: 500 }
    );
  }
}

// PUT /api/tutors/[id]
export async function PUT(request, { params }) {
  const { id } = params;
  const data = await request.json();

  const updated = await prisma.tutor.update({
    where: { id },
    data: {
      namaLengkap: data.namaLengkap,
      telepon: data.telepon,
      pendidikan: data.pendidikan,
      pengalaman: data.pengalaman,
      bio: data.bio,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}


