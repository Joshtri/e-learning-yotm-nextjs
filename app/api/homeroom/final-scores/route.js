import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { getStudentAttendanceSummary } from "@/lib/attendance-calculator";


export const maxDuration = 60;

export async function GET(request) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get("academicYearId");

    // Get the class - if academicYearId specified, use it. Otherwise get the most recent class with students
    let kelas;

    if (academicYearId) {
      kelas = await prisma.class.findFirst({
        where: {
          homeroomTeacherId: tutor.id,
          academicYearId: academicYearId,
        },
        include: {
          program: true,
          academicYear: true,
          students: {
            where: { status: "ACTIVE" },
            include: { user: true },
          },
          classSubjectTutors: {
            include: { subject: true },
            distinct: ["subjectId"],
          },
        },
      });
    } else {
      // Get all classes for this homeroom teacher, prioritize most recent with students
      const allClasses = await prisma.class.findMany({
        where: { homeroomTeacherId: tutor.id },
        include: {
          program: true,
          academicYear: true,
          students: {
            where: { status: "ACTIVE" },
            include: { user: true },
          },
          classSubjectTutors: {
            include: { subject: true },
            distinct: ["subjectId"],
          },
        },
        orderBy: [
          { academicYear: { tahunMulai: "desc" } },
          { academicYear: { semester: "desc" } }, // GENAP first, then GANJIL
        ],
      });

      // Select the class that has active students, or the most recent one
      kelas = allClasses.find((cls) => cls.students.length > 0) || allClasses[0];
    }

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

    if (!kelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Kelas tidak ditemukan untuk tahun ajaran yang dipilih",
          data: { filterOptions },
        },
        { status: 404 }
      );
    }

    // Get all subjects taught in this class
    const subjects = kelas.classSubjectTutors.map((cst) => ({
      id: cst.subject.id,
      namaMapel: cst.subject.namaMapel,
    }));

    const studentIds = kelas.students.map((s) => s.id);

    // Get submissions for this academic year only - CRITICAL FIX!
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        OR: [
          {
            assignment: {
              classSubjectTutor: {
                class: {
                  academicYearId: kelas.academicYearId,
                },
              },
            },
          },
          {
            quiz: {
              classSubjectTutor: {
                class: {
                  academicYearId: kelas.academicYearId,
                },
              },
            },
          },
        ],
      },
      include: {
        assignment: {
          include: {
            classSubjectTutor: {
              include: { subject: true },
            },
          },
        },
        quiz: {
          include: {
            classSubjectTutor: {
              include: { subject: true },
            },
          },
        },
      },
    });

    // Get skill scores for these students
    // Note: SkillScore doesn't have academicYearId field
    const skillScores = await prisma.skillScore.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: { subject: true },
    });

    // Get behavior scores for all students in this academic year
    const behaviorScores = await prisma.behaviorScore.findMany({
      where: {
        academicYearId: kelas.academicYearId,
        studentId: { in: studentIds },
      },
    });

    // Process student data
    const students = await Promise.all(
      kelas.students.map(async (student) => {
        // Initialize mapel details for all subjects
        const mapelDetails = subjects.map((subject) => ({
          namaMapel: subject.namaMapel,
          exercise: null,
          quiz: null,
          dailyTest: null,
          midterm: null,
          finalExam: null,
          skill: null,
        }));

        // Get submissions for this student only
        const studentSubmissions = submissions.filter(
          (s) => s.studentId === student.id
        );

        // Process submissions
        studentSubmissions.forEach((submission) => {
          let mapelName = null;
          let type = null;
          let nilai = submission.nilai ?? null;

          if (submission.assignment) {
            mapelName =
              submission.assignment.classSubjectTutor.subject.namaMapel;
            type = submission.assignment.jenis;
          } else if (submission.quiz) {
            mapelName = submission.quiz.classSubjectTutor.subject.namaMapel;
            type = "QUIZ";
          }

          if (!mapelName || !type) return;

          const mapelIndex = mapelDetails.findIndex(
            (m) => m.namaMapel === mapelName
          );
          if (mapelIndex === -1) return;

          if (type === "EXERCISE") mapelDetails[mapelIndex].exercise = nilai;
          if (type === "QUIZ") mapelDetails[mapelIndex].quiz = nilai;
          if (type === "DAILY_TEST")
            mapelDetails[mapelIndex].dailyTest = nilai;
          if (type === "MIDTERM") mapelDetails[mapelIndex].midterm = nilai;
          if (type === "FINAL_EXAM")
            mapelDetails[mapelIndex].finalExam = nilai;
        });

        // Get skill scores for this student only
        const studentSkills = skillScores.filter(
          (s) => s.studentId === student.id
        );

        // Process skill scores
        studentSkills.forEach((skill) => {
          const mapelIndex = mapelDetails.findIndex(
            (m) => m.namaMapel === skill.subject.namaMapel
          );
          if (mapelIndex !== -1) {
            mapelDetails[mapelIndex].skill = skill.nilai;
          }
        });

        // Find behavior score
        const behavior = behaviorScores.find(
          (b) => b.studentId === student.id
        );

        // Calculate averages and round to 2 decimal places
        const nilaiRata2PerMapel = mapelDetails.map((m) => {
          const nilaiList = [
            m.exercise,
            m.quiz,
            m.dailyTest,
            m.midterm,
            m.finalExam,
            m.skill,
          ].filter((n) => n !== null);

          if (nilaiList.length === 0) return 0;
          const avg =
            nilaiList.reduce((acc, n) => acc + n, 0) / nilaiList.length;
          return parseFloat(avg.toFixed(2));
        });

        const totalNilaiMapel = nilaiRata2PerMapel.length
          ? parseFloat(
            (
              nilaiRata2PerMapel.reduce((acc, n) => acc + n, 0) /
              nilaiRata2PerMapel.length
            ).toFixed(2)
          )
          : 0;

        const totalNilaiBehavior = behavior
          ? parseFloat(
            (
              (behavior.spiritual + behavior.sosial + behavior.kehadiran) /
              3
            ).toFixed(2)
          )
          : 0;

        const nilaiAkhir = parseFloat(
          (totalNilaiMapel * 0.7 + totalNilaiBehavior * 0.3).toFixed(2)
        );

        // ✅ Calculate Attendance Summary (Daily Aggregation)
        const attendanceSummary = await getStudentAttendanceSummary(
          student.id,
          kelas.academicYearId,
          kelas.id
        );

        return {
          id: student.id,
          namaLengkap: student.namaLengkap,
          kelas: kelas.namaKelas,
          program: kelas.program.namaPaket,
          tahunAjaran: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
          mapelDetails: mapelDetails.map((m) => ({
            namaMapel: m.namaMapel,
            exercise:
              m.exercise !== null ? parseFloat(m.exercise.toFixed(2)) : null,
            quiz: m.quiz !== null ? parseFloat(m.quiz.toFixed(2)) : null,
            dailyTest:
              m.dailyTest !== null ? parseFloat(m.dailyTest.toFixed(2)) : null,
            midterm:
              m.midterm !== null ? parseFloat(m.midterm.toFixed(2)) : null,
            finalExam:
              m.finalExam !== null ? parseFloat(m.finalExam.toFixed(2)) : null,
            skill: m.skill !== null ? parseFloat(m.skill.toFixed(2)) : null,
          })),
          behavior: behavior
            ? {
              spiritual: parseFloat(behavior.spiritual.toFixed(2)),
              sosial: parseFloat(behavior.sosial.toFixed(2)),
              kehadiran: parseFloat(behavior.kehadiran.toFixed(2)),
            }
            : null,
          nilaiAkhir,
          attendanceSummary, // ✅ Add summary to response
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        tahunAjaranId: kelas.academicYearId,
        tahunAjaran: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
        semester: kelas.academicYear.semester, // GENAP or GANJIL - clearly visible in response
        students,
        subjects,
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
      },
    });
  } catch (error) {
    console.error(error);
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
