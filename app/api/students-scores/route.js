import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const academicYearId = searchParams.get("academicYearId");

    // Build where conditions for better performance
    const whereConditions = {};
    if (classId) whereConditions.classId = classId;
    if (academicYearId) {
      whereConditions.class = { academicYearId };
    }

    // Get students with minimal data first
    const students = await prisma.student.findMany({
      where: whereConditions,
      select: {
        id: true,
        namaLengkap: true,
        classId: true,
        class: {
          select: {
            namaKelas: true,
            academicYear: {
              select: {
                tahunMulai: true,
                tahunSelesai: true,
              },
            },
            program: {
              select: {
                namaPaket: true,
              },
            },
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json({
        quizzes: [],
        assignments: [],
        students: [],
        filterOptions: {
          subjects: [],
          classes: [],
          academicYears: [],
        },
      });
    }

    const studentIds = students.map((s) => s.id);

    // Build class subject tutor filter
    const classSubjectFilter = {};
    if (subjectId) classSubjectFilter.subjectId = subjectId;
    if (classId) classSubjectFilter.classId = classId;

    // Get quizzes with better filtering
    const allQuizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutor: classSubjectFilter,
      },
      select: {
        id: true,
        judul: true,
        classSubjectTutor: {
          select: {
            subjectId: true,
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get assignments with better filtering
    const allAssignments = await prisma.assignment.findMany({
      where: {
        jenis: { in: ["EXERCISE", "MIDTERM", "FINAL_EXAM"] },
        classSubjectTutor: classSubjectFilter,
      },
      select: {
        id: true,
        judul: true,
        jenis: true,
        classSubjectTutor: {
          select: {
            subjectId: true,
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const tugasList = allAssignments.filter((a) => a.jenis === "EXERCISE");
    const utsAssignments = allAssignments.filter((a) => a.jenis === "MIDTERM");
    const uasAssignments = allAssignments.filter(
      (a) => a.jenis === "FINAL_EXAM"
    );

    // Get all submissions in one query with proper indexing
    const allSubmissions = await prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        OR: [
          {
            quizId: { in: allQuizzes.map((q) => q.id) },
          },
          {
            assignmentId: { in: allAssignments.map((a) => a.id) },
          },
        ],
      },
      select: {
        id: true,
        studentId: true,
        quizId: true,
        assignmentId: true,
        nilai: true,
      },
    });

    // Create lookup maps for O(1) access
    const submissionsByStudent = {};
    allSubmissions.forEach((sub) => {
      if (!submissionsByStudent[sub.studentId]) {
        submissionsByStudent[sub.studentId] = [];
      }
      submissionsByStudent[sub.studentId].push(sub);
    });

    // Process results efficiently
    const result = students.map((student) => {
      const studentSubmissions = submissionsByStudent[student.id] || [];

      // Calculate quiz scores
      const kuisNilai = allQuizzes.map((quiz) => {
        const submission = studentSubmissions.find(
          (sub) => sub.quizId === quiz.id
        );
        return {
          id: quiz.id,
          judul: quiz.judul,
          mataPelajaran: quiz.classSubjectTutor.subject.namaMapel,
          nilai: submission?.nilai || null,
        };
      });

      // Calculate assignment scores
      const tugasNilai = tugasList.map((assignment) => {
        const submission = studentSubmissions.find(
          (sub) => sub.assignmentId === assignment.id
        );
        return {
          id: assignment.id,
          judul: assignment.judul,
          mataPelajaran: assignment.classSubjectTutor.subject.namaMapel,
          nilai: submission?.nilai || null,
        };
      });

      // Calculate UTS/UAS scores
      const nilaiUTS =
        utsAssignments.length > 0
          ? studentSubmissions.find((sub) =>
              utsAssignments.some((uts) => uts.id === sub.assignmentId)
            )?.nilai || null
          : null;

      const nilaiUAS =
        uasAssignments.length > 0
          ? studentSubmissions.find((sub) =>
              uasAssignments.some((uas) => uas.id === sub.assignmentId)
            )?.nilai || null
          : null;

      // Calculate total average
      const nilaiList = [
        ...kuisNilai.map((k) => k.nilai),
        ...tugasNilai.map((t) => t.nilai),
        nilaiUTS,
        nilaiUAS,
      ].filter((n) => n !== null && n !== undefined);

      const totalNilai =
        nilaiList.length > 0
          ? parseFloat(
              (nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length).toFixed(
                2
              )
            )
          : null;

      return {
        studentId: student.id,
        nama: student.namaLengkap,
        kelas: student.class?.namaKelas || "-",
        program: student.class?.program?.namaPaket || "-",
        tahunAjaran: student.class?.academicYear
          ? `${student.class.academicYear.tahunMulai}/${student.class.academicYear.tahunSelesai}`
          : "-",
        kuis: kuisNilai,
        tugas: tugasNilai,
        nilaiUTS,
        nilaiUAS,
        totalNilai,
      };
    });

    // Get filter options efficiently
    const [subjects, classes, academicYears] = await Promise.all([
      prisma.subject.findMany({
        select: { id: true, namaMapel: true },
        orderBy: { namaMapel: "asc" },
      }),
      prisma.class.findMany({
        select: {
          id: true,
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
        orderBy: { namaKelas: "asc" },
      }),
      prisma.academicYear.findMany({
        select: { id: true, tahunMulai: true, tahunSelesai: true, semester: true },
        orderBy: { tahunMulai: "desc" },
      }),
    ]);

    const formattedAcademicYears = academicYears.map((year) => ({
      ...year,
      label: `${year.tahunMulai}/${year.tahunSelesai} - ${year.semester}`,
    }));

    const formattedClasses = classes.map((cls) => ({
      ...cls,
      academicYear: {
        ...cls.academicYear,
        label: `${cls.academicYear.tahunMulai}/${cls.academicYear.tahunSelesai} - ${cls.academicYear.semester}`,
      },
    }));

    return NextResponse.json({
      quizzes: allQuizzes,
      assignments: tugasList,
      students: result,
      filterOptions: {
        subjects,
        classes: formattedClasses,
        academicYears: formattedAcademicYears,
      },
    });
  } catch {
    // Remove console.error for production
    return NextResponse.json(
      { message: "Gagal ambil data nilai." },
      { status: 500 }
    );
  }
}
