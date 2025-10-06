import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Ambil data siswa berdasarkan userId
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        class: {
          include: { academicYear: true },
        },
        StudentClassHistory: {
          include: { academicYear: true, class: true },
          orderBy: { academicYear: { tahunMulai: "desc" } },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Determine the class to fetch materials for
    let targetClassId = student.class?.id;
    let targetAcademicYearId = student.class?.academicYear?.id;

    if (academicYearId) {
      const historyEntry = student.StudentClassHistory.find(
        (h) => h.academicYearId === academicYearId
      );
      if (historyEntry) {
        targetClassId = historyEntry.classId;
        targetAcademicYearId = historyEntry.academicYearId;
      } else if (student.class?.academicYear?.id === academicYearId) {
        // If the requested academicYearId is the current one
        targetClassId = student.class.id;
        targetAcademicYearId = student.class.academicYear.id;
      } else {
        // Requested academic year not found for this student
        return NextResponse.json(
          { success: false, message: "Tahun ajaran tidak ditemukan untuk siswa ini" },
          { status: 404 }
        );
      }
    } else if (student.class) {
      // Default to current active class if no academicYearId is provided
      targetClassId = student.class.id;
      targetAcademicYearId = student.class.academicYear.id;
    } else if (student.StudentClassHistory.length > 0) {
      // If no current class, default to the latest from history
      const latestHistory = student.StudentClassHistory[0];
      targetClassId = latestHistory.classId;
      targetAcademicYearId = latestHistory.academicYearId;
    } else {
      return NextResponse.json(
        { success: false, message: "Siswa belum terdaftar di kelas manapun." },
        { status: 404 }
      );
    }

    // Generate filter options from all academic years the student has been part of
    const uniqueAcademicYears = new Map();
    if (student.class?.academicYear) {
      uniqueAcademicYears.set(student.class.academicYear.id, {
        ...student.class.academicYear,
        value: student.class.academicYear.id,
        label: `${student.class.academicYear.tahunMulai}/${student.class.academicYear.tahunSelesai} - ${student.class.academicYear.semester}`,
      });
    }
    student.StudentClassHistory.forEach((history) => {
      uniqueAcademicYears.set(history.academicYear.id, {
        ...history.academicYear,
        value: history.academicYear.id,
        label: `${history.academicYear.tahunMulai}/${history.academicYear.tahunSelesai} - ${history.academicYear.semester}`,
      });
    });

    const filterOptions = { academicYears: Array.from(uniqueAcademicYears.values()) };

    // Ambil daftar mata pelajaran berdasarkan kelas siswa
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { classId: targetClassId },
      include: {
        subject: true,
        learningMaterials: {
          where: {
            classSubjectTutor: {
              class: {
                academicYearId: targetAcademicYearId,
              },
            },
          },
        },
      },
    });

    const mapped = classSubjectTutors.map((item) => ({
      mapelId: item.subject.id,
      namaMapel: item.subject.namaMapel,
      materi: (item.learningMaterials || []).map((m) => ({
        id: m.id,
        judul: m.judul,
        pertemuan: m.pertemuan || "1", // Show meeting number
        tipeMateri: m.tipeMateri, // Fixed: was 'tipe', should be 'tipeMateri'
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),
    }));

    return NextResponse.json({ success: true, data: mapped, filterOptions });
  } catch (error) {
    console.error("Gagal mengambil materi pembelajaran:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
