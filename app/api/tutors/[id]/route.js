import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET tutor by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // 🔐 Auth check
    const { user, error, status } = await getAuthUser(request);
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    // 🔎 Fetch tutor with relational data
    const tutor = await prisma.tutor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            userActivated: true,
          },
        },
        classSubjectTutors: {
          select: {
            id: true,
            classSubject: {
              select: {
                id: true,
                class: {
                  select: {
                    id: true,
                    name: true,
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
                    name: true,
                    description: true,
                  },
                },
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

    // 🔒 Authorization check: ADMIN or the tutor themself
    const isSelfOrAdmin = user.role === "ADMIN" || user.id === tutor.user.id;

    // 🧩 Format assignments
    const assignments = tutor.classSubjectTutors.map((cst) => ({
      id: cst.id,
      class: cst.classSubject.class,
      subject: cst.classSubject.subject,
    }));

    // 📦 Final response payload
    const formattedTutor = {
      id: tutor.id,
      user: tutor.user,
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
