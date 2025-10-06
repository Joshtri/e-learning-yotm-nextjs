import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        class: {
          include: {
            academicYear: true,
          },
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

    const studentId = student.id; // Re-declare studentId here

    const { searchParams } = new URL(req.url);
    const queryAcademicYearId = searchParams.get("academicYearId");
    const querySemester = searchParams.get("semester");

    let targetAcademicYearId;

    // Determine the academic year to filter by
    if (queryAcademicYearId) {
      targetAcademicYearId = queryAcademicYearId;
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
      });
    }

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: {
        classId: { in: uniqueStudentClassIdsInTargetYear },
        class: {
          academicYearId: targetAcademicYearId,
          academicYear: {
            semester: querySemester || undefined, // Add semester filter
          },
        },
      },
      select: { id: true },
    });

    const classSubjectTutorIds = classSubjectTutors.map((cst) => cst.id);

    // Only get MIDTERM and FINAL_EXAM assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        classSubjectTutorId: {
          in: classSubjectTutorIds,
        },
        jenis: {
          in: ["MIDTERM", "FINAL_EXAM"],
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              select: {
                namaKelas: true,
                academicYear: {
                  select: {
                    id: true,
                    tahunMulai: true,
                    tahunSelesai: true,
                    semester: true,
                  },
                },
              },
            },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
        submissions: {
          where: { studentId },
          select: { id: true, nilai: true },
        },
      },
      orderBy: {
        TanggalMulai: "asc",
      },
    });

    const data = assignments.map((exam) => ({
      id: exam.id,
      judul: exam.judul,
      jenis: exam.jenis,
      jenisDeskripsi:
        exam.jenis === "MIDTERM"
          ? "Ujian Tengah Semester"
          : "Ujian Akhir Semester",
      waktuMulai: exam.waktuMulai,
      waktuSelesai: exam.waktuSelesai,
      batasWaktuMenit: exam.batasWaktuMenit,
      nilaiMaksimal: exam.nilaiMaksimal,
      class: exam.classSubjectTutor.class,
      subject: exam.classSubjectTutor.subject,
      tutor: exam.classSubjectTutor.tutor,
      sudahDikerjakan: exam.submissions.length > 0,
      nilai: exam.submissions[0]?.nilai ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Gagal ambil data exams:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data ujian" },
      { status: 500 }
    );
  }
}
