import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
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
        { success: false, message: "Tutor not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // First, get ALL classes where this tutor is homeroom teacher (for filter options)
    const allHomeroomClasses = await prisma.class.findMany({
      where: {
        homeroomTeacherId: tutor.id,
      },
      include: {
        academicYear: true,
        program: true,
      },
      orderBy: {
        academicYear: {
          tahunMulai: 'desc',
        },
      },
    });

    if (allHomeroomClasses.length === 0) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Determine which class to use for data display
    let kelas;
    if (academicYearId) {
      // Find class for specific academic year
      kelas = allHomeroomClasses.find((c) => c.academicYearId === academicYearId);
      if (!kelas) {
        return NextResponse.json(
          { success: false, message: "Kelas tidak ditemukan untuk tahun ajaran yang dipilih" },
          { status: 404 }
        );
      }
    } else {
      // Find the class with active academic year, or default to first class
      kelas = allHomeroomClasses.find((c) => c.academicYear.isActive) || allHomeroomClasses[0];
    }

    if (!kelas) {
      return NextResponse.json(
        { success: false, message: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get all quizzes and assignments for this class
    const allQuizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutor: {
          classId: kelas.id,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        judul: true,
        classSubjectTutor: {
          select: {
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
          },
        },
      },
    });

    const allAssignmentsRaw = await prisma.assignment.findMany({
      where: {
        jenis: { in: ["EXERCISE", "MIDTERM", "FINAL_EXAM"] },
        classSubjectTutor: {
          classId: kelas.id,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        judul: true,
        jenis: true,
        classSubjectTutor: {
          select: {
            subject: {
              select: {
                id: true,
                namaMapel: true,
              },
            },
          },
        },
      },
    });

    // Filter assignments
    const tugasList = allAssignmentsRaw.filter((a) => a.jenis === "EXERCISE");

    // Get students in this class
    const students = await prisma.student.findMany({
      where: {
        classId: kelas.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        namaLengkap: true,
        class: {
          select: {
            namaKelas: true,
            academicYear: {
              select: {
                tahunMulai: true,
                tahunSelesai: true,
              }
            },
            program: {
              select: {
                namaPaket: true,
              }
            }
          }
        }
      },
    });

    // Get submissions with optimized query
    const allSubmissions = await prisma.submission.findMany({
      where: {
        student: {
          classId: kelas.id,
          status: "ACTIVE",
        },
      },
      select: {
        id: true,
        studentId: true,
        nilai: true,
        quizId: true,
        assignmentId: true,
        assignment: {
          select: {
            jenis: true,
          }
        }
      },
    });

    // Pre-group submissions by studentId for efficient lookup
    const submissionsByStudent = {};
    allSubmissions.forEach(sub => {
      if (!submissionsByStudent[sub.studentId]) {
        submissionsByStudent[sub.studentId] = [];
      }
      submissionsByStudent[sub.studentId].push(sub);
    });

    // Function to calculate average
    const calculateAverage = (nilaiList) => {
      const validNilai = nilaiList.filter(n => n !== null);
      if (validNilai.length === 0) return null;
      return parseFloat((validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(2));
    };

    const result = students.map((student) => {
      // Get submissions for this student
      const studentSubmissions = submissionsByStudent[student.id] || [];

      const kuisNilai = allQuizzes.map((quiz) => {
        const s = studentSubmissions.find((sub) => sub.quizId === quiz.id);
        return {
          id: quiz.id,
          judul: quiz.judul,
          mataPelajaran: quiz.classSubjectTutor.subject.namaMapel,
          nilai: s ? s.nilai : null,
        };
      });

      const tugasNilai = tugasList.map((asn) => {
        const s = studentSubmissions.find(
          (sub) => sub.assignmentId === asn.id
        );
        return {
          id: asn.id,
          judul: asn.judul,
          mataPelajaran: asn.classSubjectTutor.subject.namaMapel,
          nilai: s ? s.nilai : null,
        };
      });

      const nilaiUTS =
        studentSubmissions.find(
          (s) => s.assignment && s.assignment.jenis === "MIDTERM"
        )?.nilai ?? null;

      const nilaiUAS =
        studentSubmissions.find(
          (s) => s.assignment && s.assignment.jenis === "FINAL_EXAM"
        )?.nilai ?? null;

      // Calculate average
      const nilaiList = [
        ...kuisNilai.map((k) => k.nilai),
        ...tugasNilai.map((t) => t.nilai),
        nilaiUTS,
        nilaiUAS,
      ];
      const totalNilai = calculateAverage(nilaiList);

      return {
        studentId: student.id,
        nama: student.namaLengkap,
        kelas: student.class ? student.class.namaKelas : "-",
        program:
          student.class && student.class.program
            ? student.class.program.namaPaket
            : "-",
        tahunAjaran:
          student.class && student.class.academicYear
            ? `${student.class.academicYear.tahunMulai}/${student.class.academicYear.tahunSelesai}`
            : "-",
        kuis: kuisNilai,
        tugas: tugasNilai,
        nilaiUTS,
        nilaiUAS,
        totalNilai,
      };
    });

    // Get subjects for this class
    const subjects = await prisma.subject.findMany({
      where: {
        classSubjectTutors: {
          some: {
            classId: kelas.id,
          },
        },
      },
      select: { id: true, namaMapel: true },
    });

    // Build academic years filter options from ALL homeroom classes
    const academicYearsOptions = allHomeroomClasses.map((c) => ({
      id: c.academicYear.id,
      tahunMulai: c.academicYear.tahunMulai,
      tahunSelesai: c.academicYear.tahunSelesai,
      semester: c.academicYear.semester,
      isActive: c.academicYear.isActive,
      label: `${c.academicYear.tahunMulai}/${c.academicYear.tahunSelesai} - ${c.academicYear.semester}`,
    }));

    // Remove duplicates by academicYear.id
    const uniqueAcademicYears = academicYearsOptions.filter(
      (year, index, self) => index === self.findIndex((y) => y.id === year.id)
    );

    return NextResponse.json({
      quizzes: allQuizzes,
      assignments: tugasList,
      students: result,
      filterOptions: {
        subjects,
        classes: [
          {
            id: kelas.id,
            namaKelas: kelas.namaKelas,
            academicYear: {
              id: kelas.academicYear.id,
              tahunMulai: kelas.academicYear.tahunMulai,
              tahunSelesai: kelas.academicYear.tahunSelesai,
              semester: kelas.academicYear.semester,
              label: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai} - ${kelas.academicYear.semester}`,
            },
          },
        ],
        academicYears: uniqueAcademicYears,
      },
      classInfo: {
        id: kelas.id,
        namaKelas: kelas.namaKelas,
        program: kelas.program.namaPaket,
        semester: kelas.academicYear.semester,
        tahunAjaran: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
        academicYear: {
          id: kelas.academicYear.id,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
