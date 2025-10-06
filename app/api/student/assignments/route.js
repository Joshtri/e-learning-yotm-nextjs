import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

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

    let targetClassId = student.class?.id;
    let targetAcademicYearId = student.class?.academicYear?.id;

    // Determine the academic year to filter by
    if (academicYearId) {
      targetAcademicYearId = academicYearId;
    } else if (student.class) {
      targetAcademicYearId = student.class.academicYear.id;
    } else if (student.StudentClassHistory.length > 0) {
      targetAcademicYearId = student.StudentClassHistory[0].academicYearId;
    } else {
      return NextResponse.json(
        { success: false, message: "Siswa belum terdaftar di kelas manapun." },
        { status: 404 }
      );
    }

    // Get all class IDs the student was associated with for the targetAcademicYearId
    const studentClassesInTargetYear = student.StudentClassHistory.filter(
      (h) => h.academicYearId === targetAcademicYearId
    ).map((h) => h.classId);

    if (student.class?.academicYear?.id === targetAcademicYearId && student.class?.id) {
      studentClassesInTargetYear.push(student.class.id);
    }

    const uniqueStudentClassIdsInTargetYear = [...new Set(studentClassesInTargetYear)];

    if (uniqueStudentClassIdsInTargetYear.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        filterOptions,
      });
    }

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

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: {
        classId: { in: uniqueStudentClassIdsInTargetYear },
        class: {
          academicYearId: targetAcademicYearId,
        },
      },
      include: {
        subject: true,
        tutor: { include: { user: true } },
        learningMaterials: true,
        assignments: {
          where: {
            jenis: "EXERCISE",
            classSubjectTutor: {
              class: {
                academicYearId: targetAcademicYearId,
              },
            },
          },
          include: {
            questions: true,
            submissions: {
              where: { studentId: student.id },
              select: {
                nilai: true,
                feedback: true,
              },
            },
          },
        },
        class: {
          include: {
            academicYear: true,
          },
        },
      },
    });

    const mappedSubjects = classSubjectTutors.map((item) => ({
      id: item.subject.id,
      namaMapel: item.subject.namaMapel,
      tutor: item.tutor?.user?.nama || "Tidak ada tutor",
      jumlahMateri: item.learningMaterials?.length || 0,
      jumlahTugas: item.assignments?.length || 0, // ✅ tinggal hitung assignments langsung
      academicYear: item.class?.academicYear
        ? `${item.class.academicYear.tahunMulai}/${item.class.academicYear.tahunSelesai} - ${item.class.academicYear.semester}`
        : null,
      academicYearId: item.class?.academicYear?.id || null,
      classId: item.class?.id || null,
      className: item.class?.namaKelas || null,

      materi: (item.learningMaterials || []).map((m) => ({
        id: m.id,
        judul: m.judul,
        konten: m.konten,
        fileUrl: m.fileUrl,
        createdAt: m.createdAt,
      })),

      tugasAktif: (item.assignments || []).map((asg) => {
        const submission = asg.submissions[0]; // Ambil submission pertama (satu siswa = satu submission)
        return {
          id: asg.id,
          judul: asg.judul,
          jenis: asg.jenis,
          waktuMulai: asg.waktuMulai,
          waktuSelesai: asg.waktuSelesai,
          jumlahSoal: asg.questions?.length || 0,
          questionsFromPdf: asg.questionsFromPdf,
          nilai: submission?.nilai ?? null,
          feedback: submission?.feedback ?? null,
          status: submission ? "SUDAH_MENGERJAKAN" : "BELUM_MENGERJAKAN",
        };
      }),
    }));

    const filteredSubjectsWithTasks = mappedSubjects.filter(
      (subject) => subject.tugasAktif.length > 0
    );

    return NextResponse.json({
      success: true,
      data: filteredSubjectsWithTasks,
      filterOptions,
    });
  } catch (error) {
    console.error("Gagal mengambil data mata pelajaran siswa:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
