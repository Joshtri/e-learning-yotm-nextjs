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

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Get all academic years where this tutor is a homeroom teacher
    const homeroomClasses = await prisma.class.findMany({
      where: { homeroomTeacherId: tutor.id },
      include: { academicYear: true },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } }, // GENAP first, then GANJIL
      ],
    });

    const academicYears = homeroomClasses.map((c) => ({
      ...c.academicYear,
      value: c.academicYear.id,
      label: `${c.academicYear.tahunMulai}/${c.academicYear.tahunSelesai} - ${c.academicYear.semester}`,
    }));

    const filterOptions = { academicYears };

    let whereClause = {
      homeroomTeacherId: tutor.id,
    };

    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    } else {
      // Default to the class in the active academic year if no ID is provided
      whereClause.academicYear = {
        isActive: true,
      };
    }

    const kelas = await prisma.class.findFirst({
      where: whereClause,
      include: {
        academicYear: true,
        program: true,
      },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "desc" } }, // GENAP first, then GANJIL
      ],
    });

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Kelas tidak ditemukan untuk tahun ajaran yang dipilih",
          data: [],
          classInfo: null,
          filterOptions,
        },
        { status: 404 }
      );
    }

    // Check if this is the current active academic year
    const isCurrentYear = kelas.academicYear.isActive;

    let students = [];

    if (isCurrentYear) {
      // For current year, get students directly from classId
      students = await prisma.student.findMany({
        where: {
          classId: kelas.id,
        },
        orderBy: {
          namaLengkap: "asc",
        },
      });
    } else {
      // For historical years, use StudentClassHistory
      const studentHistories = await prisma.studentClassHistory.findMany({
        where: {
          classId: kelas.id,
          academicYearId: kelas.academicYear.id,
        },
        include: {
          student: true,
        },
        orderBy: {
          student: {
            namaLengkap: "asc",
          },
        },
      });

      students = studentHistories.map((history) => history.student);
    }

    return NextResponse.json({
      success: true,
      data: students,
      classInfo: {
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        program: kelas.program?.namaPaket,
        academicYear: {
          id: kelas.academicYear.id,
          tahunMulai: kelas.academicYear.tahunMulai,
          tahunSelesai: kelas.academicYear.tahunSelesai,
          semester: kelas.academicYear.semester,
          isActive: kelas.academicYear.isActive,
        },
      },
      filterOptions,
    });
  } catch (error) {
    console.error("Failed to load my students:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load my students" },
      { status: 500 }
    );
  }
}