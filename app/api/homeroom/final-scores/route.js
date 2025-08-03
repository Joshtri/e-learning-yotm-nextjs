import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
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

    // Get the class where this tutor is homeroom teacher
    const kelas = await prisma.class.findFirst({
      where: { homeroomTeacherId: tutor.id },
      include: {
        program: true,
        academicYear: true,
        students: {
          where: { status: "ACTIVE" },
          include: {
            user: true,
            submissions: {
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
            },
            SkillScore: { include: { subject: true } },
          },
        },
        classSubjectTutors: {
          include: { subject: true },
          distinct: ["subjectId"], // Only get unique subjects
        },
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    // Get all subjects taught in this class
    const subjects = kelas.classSubjectTutors.map((cst) => ({
      id: cst.subject.id,
      namaMapel: cst.subject.namaMapel,
    }));

    // Get behavior scores for all students
    const behaviorScores = await prisma.behaviorScore.findMany({
      where: {
        academicYearId: kelas.academicYearId,
        studentId: { in: kelas.students.map((s) => s.id) },
      },
    });

    // Process student data
    const students = kelas.students.map((student) => {
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

      // Process submissions
      student.submissions.forEach((submission) => {
        let mapelName = null;
        let type = null;
        let nilai = submission.nilai ?? null;

        if (submission.assignment) {
          mapelName = submission.assignment.classSubjectTutor.subject.namaMapel;
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
        if (type === "DAILY_TEST") mapelDetails[mapelIndex].dailyTest = nilai;
        if (type === "MIDTERM") mapelDetails[mapelIndex].midterm = nilai;
        if (type === "FINAL_EXAM") mapelDetails[mapelIndex].finalExam = nilai;
      });

      // Process skill scores
      student.SkillScore.forEach((skill) => {
        const mapelIndex = mapelDetails.findIndex(
          (m) => m.namaMapel === skill.subject.namaMapel
        );
        if (mapelIndex !== -1) {
          mapelDetails[mapelIndex].skill = skill.nilai;
        }
      });

      // Find behavior score
      const behavior = behaviorScores.find((b) => b.studentId === student.id);

      // Calculate averages
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
        return nilaiList.reduce((acc, n) => acc + n, 0) / nilaiList.length;
      });

      const totalNilaiMapel = nilaiRata2PerMapel.length
        ? nilaiRata2PerMapel.reduce((acc, n) => acc + n, 0) /
          nilaiRata2PerMapel.length
        : 0;

      const totalNilaiBehavior = behavior
        ? (behavior.spiritual + behavior.sosial + behavior.kehadiran) / 3
        : 0;

      const nilaiAkhir = totalNilaiMapel * 0.7 + totalNilaiBehavior * 0.3;

      return {
        id: student.id,
        namaLengkap: student.namaLengkap,
        kelas: kelas.namaKelas,
        program: kelas.program.namaPaket,
        tahunAjaran: `${kelas.academicYear.tahunMulai}/${kelas.academicYear.tahunSelesai}`,
        mapelDetails,
        behavior: behavior
          ? {
              spiritual: behavior.spiritual,
              sosial: behavior.sosial,
              kehadiran: behavior.kehadiran,
            }
          : null,
        nilaiAkhir,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tahunAjaranId: kelas.academicYearId, // ✅ ditambahkan di sini

          students,
          subjects,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}
