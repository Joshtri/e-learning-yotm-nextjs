import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const academicYearId = searchParams.get("academicYearId");

    // Get filter conditions
    const studentFilter = {};
    if (classId) studentFilter.classId = classId;

    if (academicYearId) {
      studentFilter.class = {
        academicYearId: academicYearId,
      };
    }

    // Get all quizzes and assignments for the selected subject
    const classSubjectFilter = subjectId ? { subjectId } : {};

    const allQuizzes = await prisma.quiz.findMany({
      where: {
        classSubjectTutor: classSubjectFilter,
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
        classSubjectTutor: classSubjectFilter,
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

    const students = await prisma.student.findMany({
      where: studentFilter,
      include: {
        user: true,
        class: {
          include: {
            academicYear: true,
            program: true,
          },
        },
        submissions: {
          include: {
            assignment: {
              include: {
                classSubjectTutor: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            quiz: {
              include: {
                classSubjectTutor: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = students.map((student) => {
      const kuisNilai = allQuizzes.map((quiz) => {
        const s = student.submissions.find((sub) => sub.quizId === quiz.id);
        return {
          id: quiz.id,
          judul: quiz.judul,
          mataPelajaran: quiz.classSubjectTutor.subject.namaMapel,
          nilai: s ? s.nilai : null,
        };
      });

      const tugasNilai = tugasList.map((asn) => {
        const s = student.submissions.find(
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
        student.submissions.find(
          (s) =>
            s.assignment &&
            s.assignment.jenis === "MIDTERM" &&
            (subjectId
              ? s.assignment.classSubjectTutor.subjectId === subjectId
              : true)
        )?.nilai ?? null;

      const nilaiUAS =
        student.submissions.find(
          (s) =>
            s.assignment &&
            s.assignment.jenis === "FINAL_EXAM" &&
            (subjectId
              ? s.assignment.classSubjectTutor.subjectId === subjectId
              : true)
        )?.nilai ?? null;

      // Filter nilai based on subject if selected
      const nilaiList = [
        ...(subjectId
          ? kuisNilai
              .filter(
                (k) =>
                  k.mataPelajaran ===
                  allQuizzes[0]?.classSubjectTutor?.subject?.namaMapel
              )
              .map((k) => k.nilai)
          : kuisNilai.map((k) => k.nilai)),
        ...(subjectId
          ? tugasNilai
              .filter(
                (t) =>
                  t.mataPelajaran ===
                  tugasList[0]?.classSubjectTutor?.subject?.namaMapel
              )
              .map((t) => t.nilai)
          : tugasNilai.map((t) => t.nilai)),
        ...(subjectId ? [nilaiUTS, nilaiUAS] : []),
      ].filter((n) => n !== null);

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

    // Get distinct subjects, classes, and academic years for filter options
    const subjects = await prisma.subject.findMany({
      select: { id: true, namaMapel: true },
    });

    const classes = await prisma.class.findMany({
      select: {
        id: true,
        namaKelas: true,
        academicYear: {
          select: {
            id: true,
            tahunMulai: true,
            tahunSelesai: true,
          },
        },
      },
    });

    const academicYears = await prisma.academicYear.findMany({
      select: { id: true, tahunMulai: true, tahunSelesai: true },
    });

    return NextResponse.json({
      quizzes: allQuizzes,
      assignments: tugasList,
      students: result,
      filterOptions: {
        subjects,
        classes,
        academicYears,
      },
    });
  } catch (error) {
    console.error("[ERROR_GET_STUDENT_SCORES]", error);
    return NextResponse.json(
      { message: "Gagal ambil data nilai." },
      { status: 500 }
    );
  }
}
