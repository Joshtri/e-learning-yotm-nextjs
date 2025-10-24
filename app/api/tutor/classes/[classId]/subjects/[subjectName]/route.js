import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request, { params }) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Await params as required by Next.js 15
    const resolvedParams = await params;
    const { classId, subjectName } = resolvedParams;
    const decodedSubjectName = decodeURIComponent(subjectName);

    // Find the class
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        program: true,
        academicYear: true,
        homeroomTeacher: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Find the subject by name
    const subject = await prisma.subject.findFirst({
      where: { namaMapel: decodedSubjectName },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Mata pelajaran tidak ditemukan" },
        { status: 404 }
      );
    }

    // Find the ClassSubjectTutor entry
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: {
        classId: classId,
        subjectId: subject.id,
        tutorId: tutor.id,
      },
      include: {
        class: {
          include: {
            program: true,
            academicYear: true,
            homeroomTeacher: {
              select: {
                id: true,
                namaLengkap: true,
              },
            },
          },
        },
        subject: true,
        tutor: {
          select: {
            id: true,
            namaLengkap: true,
            telepon: true,
          },
        },
      },
    });

    if (!classSubjectTutor) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak mengajar mata pelajaran ini di kelas ini",
        },
        { status: 403 }
      );
    }

    // Get students count in the class
    const studentsCount = await prisma.student.count({
      where: { classId: classId },
    });

    // Get assignments count for this class-subject
    const assignmentsCount = await prisma.assignment.count({
      where: {
        classSubjectTutorId: classSubjectTutor.id,
      },
    });

    // Get learning materials count
    const materialsCount = await prisma.learningMaterial.count({
      where: {
        classSubjectTutorId: classSubjectTutor.id,
      },
    });

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutorId: classSubjectTutor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    // Get recent materials
    const recentMaterials = await prisma.learningMaterial.findMany({
      where: {
        classSubjectTutorId: classSubjectTutor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        classSubjectTutor,
        stats: {
          studentsCount,
          assignmentsCount,
          materialsCount,
        },
        recentAssignments,
        recentMaterials,
      },
    });
  } catch (error) {
    console.error("Error fetching class subject details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server",
      },
      { status: 500 }
    );
  }
}
