import { getAuthUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Autentikasi user
    const { user, error, status } = await getAuthUser(request);

    if (error) {
      return new Response(
        JSON.stringify({ success: false, message: error }),
        { status }
      );
    }

    // Cari student
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true },
        },
        class: {
          include: {
            program: true,
            classSubjects: {
              include: {
                subject: true,
                classSubjectTutors: {
                  include: {
                    tutor: {
                      include: {
                        user: {
                          select: { name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return new Response(
        JSON.stringify({ success: false, message: "Student not found" }),
        { status: 404 }
      );
    }

    // Cek otorisasi
    const isAdmin = user.role === 'ADMIN';
    const isStudent = user.id === student.user.id;
    const isTutor = user.role === 'TUTOR';

    if (!isAdmin && !isStudent && !isTutor) {
      return new Response(
        JSON.stringify({ success: false, message: "FORBIDDEN" }),
        { status: 403 }
      );
    }

    // Format response
    const classData = student.class
      ? {
          id: student.class.id,
          name: student.class.name,
          program: {
            id: student.class.program.id,
            name: student.class.program.namaPaket,
          },
          subjects: student.class.classSubjects.map((cs) => ({
            id: cs.id,
            name: cs.subject.name,
            description: cs.subject.description,
            tutors: cs.classSubjectTutors.map((cst) => ({
              id: cst.tutor.id,
              name: cst.tutor.user.name,
            })),
          })),
        }
      : null;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          student: {
            id: student.id,
            userId: student.user.id,
          },
          class: classData,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching student classes:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch student class details",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
