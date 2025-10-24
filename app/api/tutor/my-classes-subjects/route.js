import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Get tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause = {
      tutorId: tutor.id,
    };

    if (academicYearId) {
      whereClause.class = {
        academicYearId: academicYearId,
      };
    }

    // Get class-subject-tutor relationships
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: whereClause,
      include: {
        class: {
          include: {
            academicYear: true,
          },
        },
        subject: true,
      },
      orderBy: [
        { class: { namaKelas: "asc" } },
        { subject: { namaMapel: "asc" } },
      ],
    });

    // Extract unique classes
    const classMap = new Map();
    classSubjectTutors.forEach((cst) => {
      if (!classMap.has(cst.class.id)) {
        classMap.set(cst.class.id, {
          id: cst.class.id,
          namaKelas: cst.class.namaKelas,
          academicYear: cst.class.academicYear,
        });
      }
    });

    // Extract unique subjects
    const subjectMap = new Map();
    classSubjectTutors.forEach((cst) => {
      if (!subjectMap.has(cst.subject.id)) {
        subjectMap.set(cst.subject.id, {
          id: cst.subject.id,
          namaMapel: cst.subject.namaMapel,
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        classes: Array.from(classMap.values()),
        subjects: Array.from(subjectMap.values()),
      },
    });
  } catch (error) {
    console.error("Error fetching tutor classes and subjects:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
