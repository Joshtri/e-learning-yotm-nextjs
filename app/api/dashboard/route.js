import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { getUserFromCookie } from "@/utils/auth";

export async function GET(request) {
  try {
    // Get user from cookie
    const user = await getUserFromCookie();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    // Get total counts
    const [
      totalStudents,
      totalTutors,
      totalClasses,
      totalSubjects,
      totalPrograms,
      totalAssignments,
      totalQuizzes,
      totalMaterials,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.tutor.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.program.count(),
      prisma.assignment.count(),
      prisma.quiz.count(),
      prisma.learningMaterial.count(),
    ]);

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        student: true,
        tutor: true,
      },
    });

    // Get classes with student & subject info
    const classesWithStudents = await prisma.class.findMany({
      include: {
        program: true,
        academicYear: true,
        students: {
          select: { id: true },
        },
        classSubjectTutors: {
          include: {
            subject: true,
            tutor: {
              include: {
                user: { select: { nama: true } },
              },
            },
          },
        },
      },
      orderBy: { namaKelas: "asc" },
    });

    // Get all submissions
    const submissions = await prisma.submission.findMany({
      select: {
        status: true,
        nilai: true,
        createdAt: true,
      },
    });

    const submissionStats = {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === "SUBMITTED").length,
      graded: submissions.filter((s) => s.status === "GRADED").length,
      late: submissions.filter((s) => s.status === "LATE").length,
      notStarted: submissions.filter((s) => s.status === "NOT_STARTED").length,
      inProgress: submissions.filter((s) => s.status === "IN_PROGRESS").length,
      averageScore:
        submissions.filter((s) => s.nilai !== null).length > 0
          ? submissions
              .filter((s) => s.nilai !== null)
              .reduce((sum, s) => sum + s.nilai, 0) /
            submissions.filter((s) => s.nilai !== null).length
          : 0,
    };

    // Recent activities (from submissions and users)
    const recentActivities = [
      ...(
        await prisma.submission.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            student: { include: { user: { select: { nama: true } } } },
            assignment: { select: { judul: true } },
            quiz: { select: { judul: true } },
          },
        })
      ).map((s) => ({
        type: "submission",
        title: s.assignment?.judul || s.quiz?.judul || "Untitled",
        user: s.student.user.nama,
        status: s.status,
        date: s.createdAt,
      })),
      ...(
        await prisma.user.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nama: true,
            role: true,
            createdAt: true,
          },
        })
      ).map((u) => ({
        type: "new_user",
        title: `New ${u.role.toLowerCase()} registered`,
        user: u.nama,
        status: "ACTIVE",
        date: u.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Program statistics
    const programsWithStats = (
      await prisma.program.findMany({
        include: {
          classes: {
            include: {
              students: {
                select: { id: true },
              },
            },
          },
        },
      })
    ).map((program) => ({
      id: program.id,
      name: program.namaPaket,
      totalClasses: program.classes.length,
      totalStudents: program.classes.reduce(
        (sum, cls) => sum + cls.students.length,
        0
      ),
    }));

    // Subject statistics
    const subjectsWithStats = (
      await prisma.subject.findMany({
        include: {
          classSubjectTutors: {
            include: {
              class: {
                include: {
                  students: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      })
    ).map((subject) => ({
      id: subject.id,
      name: subject.namaMapel,
      code: subject.kodeMapel,
      totalClasses: subject.classSubjectTutors.length,
      totalStudents: subject.classSubjectTutors.reduce(
        (sum, cst) => sum + cst.class.students.length,
        0
      ),
    }));

    // Monthly stats
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [recentlyCreatedUsers, recentSubmissions] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { role: true, createdAt: true },
      }),
      prisma.submission.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { status: true, createdAt: true },
      }),
    ]);

    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.unshift({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, "MMM yyyy"),
      });
    }

    const monthlyStats = months.map((month) => {
      const usersInMonth = recentlyCreatedUsers.filter((u) => {
        const d = new Date(u.createdAt);
        return (
          d.getMonth() + 1 === month.month && d.getFullYear() === month.year
        );
      });
      const students = usersInMonth.filter((u) => u.role === "STUDENT").length;
      const tutors = usersInMonth.filter((u) => u.role === "TUTOR").length;

      const submissionsInMonth = recentSubmissions.filter((s) => {
        const d = new Date(s.createdAt);
        return (
          d.getMonth() + 1 === month.month && d.getFullYear() === month.year
        );
      });

      const submitted = submissionsInMonth.filter(
        (s) => s.status === "SUBMITTED"
      ).length;
      const graded = submissionsInMonth.filter(
        (s) => s.status === "GRADED"
      ).length;

      return {
        label: month.label,
        students,
        tutors,
        submitted,
        graded,
      };
    });

    // Today's schedule (assignments + quizzes)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaysAssignments, todaysQuizzes] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          waktuMulai: { lte: tomorrow },
          waktuSelesai: { gte: today },
        },
        include: {
          classSubjectTutor: {
            include: {
              class: true,
              subject: true,
              tutor: {
                include: {
                  user: { select: { nama: true } },
                },
              },
            },
          },
        },
      }),
      prisma.quiz.findMany({
        where: {
          waktuMulai: { lte: tomorrow },
          waktuSelesai: { gte: today },
        },
        include: {
          classSubjectTutor: {
            include: {
              class: true,
              subject: true,
              tutor: {
                include: {
                  user: { select: { nama: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    const todaysSchedule = [
      ...todaysAssignments.map((a) => ({
        type: "assignment",
        title: a.judul,
        subject: a.classSubjectTutor.subject.namaMapel,
        class: a.classSubjectTutor.class.namaKelas,
        tutor: a.classSubjectTutor.tutor.user.nama,
        startTime: a.waktuMulai,
        endTime: a.waktuSelesai,
      })),
      ...todaysQuizzes.map((q) => ({
        type: "quiz",
        title: q.judul,
        subject: q.classSubjectTutor.subject.namaMapel,
        class: q.classSubjectTutor.class.namaKelas,
        tutor: q.classSubjectTutor.tutor.user.nama,
        startTime: q.waktuMulai,
        endTime: q.waktuSelesai,
        duration: q.durasiMenit,
      })),
    ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return NextResponse.json({
      overview: {
        totalStudents,
        totalTutors,
        totalClasses,
        totalSubjects,
        totalPrograms,
        totalAssignments,
        totalQuizzes,
        totalMaterials,
        submissionStats,
        currentAcademicYear: currentAcademicYear
          ? {
              id: currentAcademicYear.id,
              year: `${currentAcademicYear.tahunMulai}/${currentAcademicYear.tahunSelesai}`,
            }
          : null,
      },
      recentActivities,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.nama,
        role: user.role,
        createdAt: user.createdAt,
        studentId: user.student?.id || null,
        tutorId: user.tutor?.id || null,
      })),
      classes: classesWithStudents.map((cls) => ({
        id: cls.id,
        name: cls.namaKelas,
        program: cls.program.namaPaket,
        academicYear: `${cls.academicYear.tahunMulai}/${cls.academicYear.tahunSelesai}`,
        studentCount: cls.students.length,
        subjectCount: cls.classSubjectTutors.length,
        subjects: cls.classSubjectTutors.map((cst) => ({
          id: cst.subject.id,
          name: cst.subject.namaMapel,
          tutor: cst.tutor.user.nama,
        })),
      })),
      programs: programsWithStats,
      subjects: subjectsWithStats,
      monthlyStats,
      todaysSchedule,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
