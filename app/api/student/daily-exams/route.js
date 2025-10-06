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

    const { searchParams } = new URL(req.url);
    const queryAcademicYearId = searchParams.get("academicYearId");
    const querySemester = searchParams.get("semester");

    // Build a list of all classes the student has been in
    let allStudentClassIds = [];

    if (student.class?.id) {
      allStudentClassIds.push(student.class.id);
    }

    if (student.StudentClassHistory.length > 0) {
      const historyClassIds = student.StudentClassHistory.map(h => h.classId);
      allStudentClassIds.push(...historyClassIds);
    }

    const uniqueStudentClassIds = [...new Set(allStudentClassIds)];

    if (uniqueStudentClassIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Build the where clause dynamically based on filters
    const whereClause = {
      classId: { in: uniqueStudentClassIds },
    };

    // Add academic year filter if provided
    if (queryAcademicYearId && queryAcademicYearId !== "all") {
      whereClause.class = {
        academicYearId: queryAcademicYearId,
      };
    }

    // Add semester filter if provided
    if (querySemester && querySemester !== "all") {
      if (!whereClause.class) {
        whereClause.class = {};
      }
      whereClause.class.academicYear = {
        semester: querySemester,
      };
    }

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: whereClause,
      select: { id: true },
    });

    const classSubjectTutorIds = classSubjectTutors.map((cst) => cst.id);

    const exams = await prisma.assignment.findMany({
      where: {
        classSubjectTutorId: {
          in: classSubjectTutorIds,
        },
        jenis: {
          in: ["DAILY_TEST", "START_SEMESTER_TEST"],
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: {
              select: {
                id: true,
                namaKelas: true,
                academicYearId: true,
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
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
      },
      orderBy: {
        TanggalMulai: "desc",
      },
    });

    // Check which exams the student has submitted
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
        assignmentId: { in: exams.map(e => e.id) },
      },
      select: {
        assignmentId: true,
        status: true,
      },
    });

    const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]));

    // Format supaya frontend lebih gampang pakai
    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      judul: exam.judul,
      jenis: exam.jenis,
      waktuMulai: exam.TanggalMulai,
      waktuSelesai: exam.TanggalSelesai,
      sudahDikerjakan: submissionMap.has(exam.id) && submissionMap.get(exam.id).status === 'SUBMITTED',
      class: exam.classSubjectTutor.class,
      subject: exam.classSubjectTutor.subject,
      tutor: exam.classSubjectTutor.tutor,
    }));

    return new Response(
      JSON.stringify({ success: true, data: formattedExams }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gagal GET daily exams:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat ujian harian" }),
      { status: 500 }
    );
  }
}
