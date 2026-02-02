import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const academicYearId = searchParams.get("academicYearId");

    // Fetch students - use history for past semesters, current classId for active semester
    let students = [];
    let historyClassData = null; // Store class data from history for display

    // If both classId and academicYearId provided, try to get from history first
    if (classId && academicYearId) {
      // Check if this is a historical query (not the student's current class)
      const classHistory = await prisma.studentClassHistory.findMany({
        where: {
          classId: classId,
          academicYearId: academicYearId,
        },
        include: {
          student: {
            select: {
              id: true,
              namaLengkap: true,
              classId: true,
            },
          },
          class: {
            select: {
              namaKelas: true,
              program: {
                select: { namaPaket: true },
              },
              academicYear: {
                select: { tahunMulai: true, tahunSelesai: true },
              },
            },
          },
        },
      });

      if (classHistory.length > 0) {
        // Use history data
        historyClassData = classHistory[0].class;
        students = classHistory.map((h) => ({
          id: h.student.id,
          namaLengkap: h.student.namaLengkap,
          classId: h.classId,
          class: h.class,
        }));
      }
    }

    // Fallback: If no history found, try current students
    if (students.length === 0) {
      const whereConditions = {};
      if (classId) whereConditions.classId = classId;
      if (academicYearId) {
        whereConditions.class = { academicYearId };
      }

      students = await prisma.student.findMany({
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
    }

    // Always fetch filter options regardless of students count
    const [subjects, classes, academicYears] = await Promise.all([
      prisma.subject.findMany({
        select: { id: true, namaMapel: true, programId: true },
        orderBy: { namaMapel: "asc" },
      }),
      prisma.class.findMany({
        select: {
          id: true,
          namaKelas: true,
          programId: true,
          program: {
            select: {
              id: true,
              namaPaket: true,
            },
          },
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

    // Return early with filter options if no students
    if (students.length === 0) {
      return NextResponse.json({
        quizzes: [],
        assignments: [],
        students: [],
        filterOptions: {
          subjects,
          classes: formattedClasses,
          academicYears: formattedAcademicYears,
        },
      });
    }

    const studentIds = students.map((s) => s.id);

    // Build submission filter - fetch ALL submissions for these students first
    const submissionWhere = {
      studentId: { in: studentIds },
    };

    // Filter by subject if provided
    if (subjectId) {
      submissionWhere.OR = [
        {
          quiz: {
            classSubjectTutor: { subjectId },
          },
        },
        {
          assignment: {
            classSubjectTutor: { subjectId },
          },
        },
      ];
    }

    // Filter by class's academic year if provided
    if (classId) {
      // Get the academic year of the selected class
      const selectedClass = await prisma.class.findUnique({
        where: { id: classId },
        select: { academicYearId: true },
      });

      if (selectedClass) {
        submissionWhere.OR = [
          {
            quiz: {
              classSubjectTutor: {
                class: { academicYearId: selectedClass.academicYearId },
                ...(subjectId && { subjectId }),
              },
            },
          },
          {
            assignment: {
              classSubjectTutor: {
                class: { academicYearId: selectedClass.academicYearId },
                ...(subjectId && { subjectId }),
              },
            },
          },
        ];
      }
    }

    // Fetch all submissions with quiz and assignment details
    const allSubmissions = await prisma.submission.findMany({
      where: submissionWhere,
      select: {
        id: true,
        studentId: true,
        quizId: true,
        assignmentId: true,
        nilai: true,
        quiz: {
          select: {
            id: true,
            judul: true,
            classSubjectTutor: {
              select: {
                subjectId: true,
                classId: true,
                subject: {
                  select: {
                    id: true,
                    namaMapel: true,
                  },
                },
              },
            },
          },
        },
        assignment: {
          select: {
            id: true,
            judul: true,
            jenis: true,
            classSubjectTutor: {
              select: {
                subjectId: true,
                classId: true,
                subject: {
                  select: {
                    id: true,
                    namaMapel: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Derive unique quizzes and assignments from submissions
    const quizMap = new Map();
    const assignmentMap = new Map();

    allSubmissions.forEach((sub) => {
      if (sub.quiz && !quizMap.has(sub.quiz.id)) {
        quizMap.set(sub.quiz.id, {
          id: sub.quiz.id,
          judul: sub.quiz.judul,
          classSubjectTutor: sub.quiz.classSubjectTutor,
        });
      }
      if (sub.assignment && !assignmentMap.has(sub.assignment.id)) {
        assignmentMap.set(sub.assignment.id, {
          id: sub.assignment.id,
          judul: sub.assignment.judul,
          jenis: sub.assignment.jenis,
          classSubjectTutor: sub.assignment.classSubjectTutor,
        });
      }
    });

    const allQuizzes = Array.from(quizMap.values());
    const allAssignmentsFromSubs = Array.from(assignmentMap.values());

    const tugasList = allAssignmentsFromSubs.filter((a) => a.jenis === "EXERCISE");
    const utsAssignments = allAssignmentsFromSubs.filter((a) => a.jenis === "MIDTERM");
    const uasAssignments = allAssignmentsFromSubs.filter((a) => a.jenis === "FINAL_EXAM");

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
