import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export async function GET() {
  try {
    const user = getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: { tutorId: tutor.id },
      include: {
        class: {
          include: {
            program: true,
            academicYear: true,
            students: {
              select: { id: true },
            },
          },
        },
        subject: true,
      },
    });

    const cstIds = classSubjectTutors.map((cst) => cst.id);

    const [recentAssignments, recentQuizzes, recentMaterials] =
      await Promise.all([
        prisma.assignment.findMany({
          where: { classSubjectTutorId: { in: cstIds } },
          include: {
            classSubjectTutor: { include: { class: true, subject: true } },
            submissions: { select: { id: true, status: true, nilai: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.quiz.findMany({
          where: { classSubjectTutorId: { in: cstIds } },
          include: {
            classSubjectTutor: { include: { class: true, subject: true } },
            submissions: { select: { id: true, status: true, nilai: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.learningMaterial.findMany({
          where: { classSubjectTutorId: { in: cstIds } },
          include: {
            classSubjectTutor: { include: { class: true, subject: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    const submissionsNeedingGrading = await prisma.submission.findMany({
      where: {
        OR: [
          { assignmentId: { in: recentAssignments.map((a) => a.id) } },
          { quizId: { in: recentQuizzes.map((q) => q.id) } },
        ],
        status: "SUBMITTED",
      },
      include: {
        student: { include: { user: { select: { nama: true } } } },
        assignment: {
          include: {
            classSubjectTutor: { include: { subject: true, class: true } },
          },
        },
        quiz: {
          include: {
            classSubjectTutor: { include: { subject: true, class: true } },
          },
        },
      },
      orderBy: { waktuKumpul: "asc" },
      take: 10,
    });

    const classStats = classSubjectTutors.map((cst) => {
      const totalStudents = cst.class.students.length;
      const assignmentsForClass = recentAssignments.filter(
        (a) => a.classSubjectTutorId === cst.id
      );
      const quizzesForClass = recentQuizzes.filter(
        (q) => q.classSubjectTutorId === cst.id
      );

      let totalSubmissions = 0,
        totalScores = 0;

      [...assignmentsForClass, ...quizzesForClass].forEach((item) => {
        item.submissions.forEach((submission) => {
          if (submission.nilai !== null) {
            totalScores += submission.nilai;
            totalSubmissions++;
          }
        });
      });

      const averageScore =
        totalSubmissions > 0 ? totalScores / totalSubmissions : 0;

      return {
        classId: cst.class.id,
        className: cst.class.namaKelas,
        program: cst.class.program.namaPaket,
        subject: cst.subject.namaMapel,
        totalStudents,
        averageScore,
        academicYear: `${cst.class.academicYear.tahunMulai}/${cst.class.academicYear.tahunSelesai}`,
      };
    });

    const [totalAssignments, totalQuizzes, totalMaterials, allSubmissions] =
      await Promise.all([
        prisma.assignment.count({
          where: { classSubjectTutorId: { in: cstIds } },
        }),
        prisma.quiz.count({ where: { classSubjectTutorId: { in: cstIds } } }),
        prisma.learningMaterial.count({
          where: { classSubjectTutorId: { in: cstIds } },
        }),
        prisma.submission.findMany({
          where: {
            OR: [
              { assignment: { classSubjectTutorId: { in: cstIds } } },
              { quiz: { classSubjectTutorId: { in: cstIds } } },
            ],
          },
          select: { status: true, nilai: true },
        }),
      ]);

    const submissionStats = {
      total: allSubmissions.length,
      submitted: allSubmissions.filter((s) => s.status === "SUBMITTED").length,
      graded: allSubmissions.filter((s) => s.status === "GRADED").length,
      late: allSubmissions.filter((s) => s.status === "LATE").length,
      averageScore:
        allSubmissions.filter((s) => s.nilai !== null).length > 0
          ? allSubmissions
              .filter((s) => s.nilai !== null)
              .reduce((sum, s) => sum + s.nilai, 0) /
            allSubmissions.filter((s) => s.nilai !== null).length
          : 0,
    };

    return NextResponse.json({
      tutor: {
        id: tutor.id,
        name: tutor.namaLengkap || tutor.user.nama,
        email: tutor.user.email,
        bio: tutor.bio,
      },
      classes: classStats,
      recentAssignments: recentAssignments.map((a) => ({
        id: a.id,
        title: a.judul,
        subject: a.classSubjectTutor.subject.namaMapel,
        class: a.classSubjectTutor.class.namaKelas,
        dueDate: a.waktuSelesai,
        submissionCount: a.submissions.length,
        type: a.jenis,
      })),
      recentQuizzes: recentQuizzes.map((q) => ({
        id: q.id,
        title: q.judul,
        subject: q.classSubjectTutor.subject.namaMapel,
        class: q.classSubjectTutor.class.namaKelas,
        dueDate: q.waktuSelesai,
        submissionCount: q.submissions.length,
        duration: q.durasiMenit,
      })),
      recentMaterials: recentMaterials.map((m) => ({
        id: m.id,
        title: m.judul,
        subject: m.classSubjectTutor.subject.namaMapel,
        class: m.classSubjectTutor.class.namaKelas,
        createdAt: m.createdAt,
        hasFile: !!m.fileUrl,
      })),
      submissionsNeedingGrading: submissionsNeedingGrading.map((s) => ({
        id: s.id,
        studentName: s.student.namaLengkap || s.student.user.nama,
        title: s.assignment?.judul || s.quiz?.judul || "Untitled",
        subject:
          s.assignment?.classSubjectTutor?.subject?.namaMapel ||
          s.quiz?.classSubjectTutor?.subject?.namaMapel ||
          "Unknown",
        class:
          s.assignment?.classSubjectTutor?.class?.namaKelas ||
          s.quiz?.classSubjectTutor?.class?.namaKelas ||
          "Unknown",
        submittedAt: s.waktuKumpul,
        type: s.assignment ? "Assignment" : "Quiz",
      })),
      statistics: {
        totalStudents: new Set(
          classSubjectTutors.flatMap((cst) =>
            cst.class.students.map((s) => s.id)
          )
        ).size,
        totalAssignments,
        totalQuizzes,
        totalMaterials,
        submissions: submissionStats,
      },
    });
  } catch (error) {
    console.error("Error fetching tutor dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
