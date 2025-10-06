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

    let whereClause = {
      homeroomTeacherId: tutor.id,
    };

    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    } else {
      whereClause.students = {
        some: {
          status: "ACTIVE",
        },
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
        { academicYear: { semester: "asc" } },
      ],
    });

    const homeroomClasses = await prisma.class.findMany({
      where: { homeroomTeacherId: tutor.id },
      include: { academicYear: true },
      orderBy: [
        { academicYear: { tahunMulai: "desc" } },
        { academicYear: { semester: "asc" } },
      ],
    });

    const academicYears = homeroomClasses.map((c) => ({
      ...c.academicYear,
      value: c.academicYear.id,
      label: `${c.academicYear.tahunMulai}/${c.academicYear.tahunSelesai} - ${c.academicYear.semester}`,
    }));

    const filterOptions = { academicYears };

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Kelas tidak ditemukan untuk tahun ajaran yang dipilih",
          filterOptions,
        },
        { status: 404 }
      );
    }

    // Get all students in this class (only ACTIVE)
    const students = await prisma.student.findMany({
      where: {
        classId: kelas.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        namaLengkap: true,
      },
    });

    // Get all subjects taught in this class through ClassSubjectTutor
    const classSubjects = await prisma.classSubjectTutor.findMany({
      where: {
        classId: kelas.id,
      },
      include: {
        subject: true,
        tutor: true,
      },
    });

    // Get all assignments for this class
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST", "MIDTERM", "FINAL_EXAM"],
        },
      },
      include: {
        submissions: {
          include: {
            student: {
              select: { id: true },
            },
          },
        },
        classSubjectTutor: {
          include: {
            subject: {
              select: { namaMapel: true },
            },
          },
        },
      },
    });

    // Structure the data by student and subject
    const result = students.map((student) => {
      // First create a map with all subjects taught in this class
      const subjectsMap = {};
      classSubjects.forEach((cs) => {
        subjectsMap[cs.subject.namaMapel] = {
          mataPelajaran: cs.subject.namaMapel,
          DAILY_TEST: null,
          START_SEMESTER_TEST: null,
          MIDTERM: null,
          FINAL_EXAM: null,
        };
      });

      // Then populate with actual submission data if available
      const studentSubmissions = assignments.flatMap((assignment) => {
        return assignment.submissions
          .filter((sub) => sub.student.id === student.id)
          .map((sub) => ({
            mataPelajaran: assignment.classSubjectTutor.subject.namaMapel,
            jenis: assignment.jenis,
            nilai: sub.nilai,
          }));
      });

      studentSubmissions.forEach((sub) => {
        if (subjectsMap[sub.mataPelajaran]) {
          // Format nilai ke 2 desimal
          const nilai = sub.nilai !== null && sub.nilai !== undefined
            ? parseFloat(parseFloat(sub.nilai).toFixed(2))
            : null;
          subjectsMap[sub.mataPelajaran][sub.jenis] = nilai;
        }
      });

      return {
        studentId: student.id,
        namaLengkap: student.namaLengkap,
        mapel: Object.values(subjectsMap),
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
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
    console.error("Gagal memuat rekap nilai ujian:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat rekap nilai ujian" },
      { status: 500 }
    );
  }
}
