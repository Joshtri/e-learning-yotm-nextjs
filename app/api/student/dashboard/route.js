import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        user: { select: { nama: true, email: true, lastLoginAt: true } },
        class: {
          include: {
            program: true,
            academicYear: true,
            classSubjectTutors: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Profil siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (!student.class || !student.class.academicYear.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Anda tidak terdaftar di kelas pada tahun ajaran aktif saat ini.",
        },
        { status: 404 }
      );
    }

    const studentId = student.id;
    const now = new Date();
    const cstIds = student.class.classSubjectTutors.map((cst) => cst.id);

    const [
      upcomingAssignments,
      upcomingQuizzes,
      recentSubmissions,
      allSubmissions,
      recentMaterials,
      classSubjectTutors,
      todaySchedule,
    ] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          classSubjectTutorId: { in: cstIds },
          TanggalSelesai: { gte: now },
          // TanggalMulai: { lte: now },
          jenis: "EXERCISE",
          classSubjectTutor: {
            class: {
              academicYearId: student.class.academicYearId,
              academicYear: {
                semester: student.class.academicYear.semester,
              },
            },
          },
        },
        include: { classSubjectTutor: { include: { subject: true } } },
        orderBy: { TanggalSelesai: "asc" },
        take: 5,
      }),
      prisma.quiz.findMany({
        where: {
          classSubjectTutorId: { in: cstIds },
          waktuSelesai: { gte: now },
          classSubjectTutor: {
            class: {
              academicYearId: student.class.academicYearId,
              academicYear: {
                semester: student.class.academicYear.semester,
              },
            },
          },
        },
        include: { classSubjectTutor: { include: { subject: true } } },
        orderBy: { waktuSelesai: "asc" },
        take: 5,
      }),
      prisma.submission.findMany({
        where: {
          studentId,
          OR: [
            {
              assignment: {
                classSubjectTutor: {
                  class: {
                    academicYearId: student.class.academicYearId,
                    academicYear: {
                      semester: student.class.academicYear.semester,
                    },
                  },
                },
              },
            },
            {
              quiz: {
                classSubjectTutor: {
                  class: {
                    academicYearId: student.class.academicYearId,
                    academicYear: {
                      semester: student.class.academicYear.semester,
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          assignment: {
            include: { classSubjectTutor: { include: { subject: true } } },
          },
          quiz: {
            include: { classSubjectTutor: { include: { subject: true } } },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.submission.findMany({
        where: {
          studentId,
          nilai: { not: null },
          OR: [
            {
              assignment: {
                classSubjectTutor: {
                  class: {
                    academicYearId: student.class.academicYearId,
                    academicYear: {
                      semester: student.class.academicYear.semester,
                    },
                  },
                },
              },
            },
            {
              quiz: {
                classSubjectTutor: {
                  class: {
                    academicYearId: student.class.academicYearId,
                    academicYear: {
                      semester: student.class.academicYear.semester,
                    },
                  },
                },
              },
            },
          ],
        },
        include: { assignment: true, quiz: true },
      }),
      prisma.learningMaterial.findMany({
        where: {
          classSubjectTutorId: { in: cstIds },
          classSubjectTutor: {
            class: {
              academicYearId: student.class.academicYearId,
              academicYear: {
                semester: student.class.academicYear.semester,
              },
            },
          },
        },
        include: { classSubjectTutor: { include: { subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.classSubjectTutor.findMany({
        where: { id: { in: cstIds } },
        include: {
          subject: true,
          tutor: { include: { user: { select: { nama: true } } } },
        },
      }),
      prisma.schedule.findMany({
        where: {
          classSubjectTutorId: { in: cstIds },
          dayOfWeek: now.getDay() || 7, // 1 (Mon) - 7 (Sun)
        },
        include: {
          classSubjectTutor: {
            include: {
              subject: true,
              tutor: { include: { user: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),
    ]);

    const scoresBySubject = {};
    let totalScore = 0;
    let totalItems = 0;

    for (const s of allSubmissions) {
      if (s.nilai) {
        totalScore += s.nilai;
        totalItems++;

        const subjectId = s.assignment
          ? s.assignment.classSubjectTutorId
          : s.quiz.classSubjectTutorId;

        if (!scoresBySubject[subjectId]) {
          scoresBySubject[subjectId] = { total: 0, count: 0 };
        }

        scoresBySubject[subjectId].total += s.nilai;
        scoresBySubject[subjectId].count++;
      }
    }

    const subjects = classSubjectTutors.map((cst) => ({
      id: cst.subject.id,
      name: cst.subject.namaMapel,
      tutorName: cst.tutor.user.nama,
      averageScore:
        scoresBySubject[cst.id]?.total / scoresBySubject[cst.id]?.count || 0,
    }));

    const submissionStats = {
      total: allSubmissions.length,
      completed: allSubmissions.filter((s) =>
        ["SUBMITTED", "GRADED"].includes(s.status)
      ).length,
      late: allSubmissions.filter((s) => s.status === "LATE").length,
      graded: allSubmissions.filter((s) => s.status === "GRADED").length,
      averageScore: totalItems > 0 ? totalScore / totalItems : 0,
    };

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.namaLengkap || student.user.nama,
        class: `${student.class.namaKelas} - ${student.class.program.namaPaket}`,
        academicYear: `${student.class.academicYear.tahunMulai}/${student.class.academicYear.tahunSelesai} - ${student.class.academicYear.semester}`,
      },
      upcomingAssignments: upcomingAssignments.map((a) => ({
        id: a.id,
        title: a.judul,
        subject: a.classSubjectTutor.subject.namaMapel,
        startDate: a.TanggalMulai, // ✅ ditambahkan
        dueDate: a.TanggalSelesai,
        type: a.jenis,
      })),
      upcomingQuizzes: upcomingQuizzes.map((q) => ({
        id: q.id,
        title: q.judul,
        subject: q.classSubjectTutor.subject.namaMapel,
        startDate: q.waktuMulai, // ✅ ditambahkan juga biar konsisten
        dueDate: q.waktuSelesai,
        duration: q.durasiMenit,
      })),
      recentSubmissions: recentSubmissions
        .filter(
          (s) =>
            (s.assignment && s.assignment.jenis === "EXERCISE") ||
            s.quiz !== null
        )
        .map((s) => ({
          id: s.id,
          title: s.assignment?.judul || s.quiz?.judul || "Untitled",
          subject:
            s.assignment?.classSubjectTutor?.subject?.namaMapel ||
            s.quiz?.classSubjectTutor?.subject?.namaMapel ||
            "Unknown",
          submittedAt: s.waktuKumpul,
          status: s.status,
          score: s.nilai,
        })),
      recentMaterials: recentMaterials.map((m) => {
        const tipeMateri = (m.tipeMateri || m.tipe || "").toString().trim().toUpperCase();
        const extractFirstUrl = (text = "") => {
          const match = String(text).match(/https?:\/\/[^\s)]+/i);
          return match ? match[0] : null;
        };
        const isYouTubeUrl = (url = "") =>
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

        const url = m.fileUrl || extractFirstUrl(m.konten) || null;
        let type = "FILE";

        if (tipeMateri === "LINK_YOUTUBE" || isYouTubeUrl(url)) {
          type = "LINK_YOUTUBE";
        }

        return {
          id: m.id,
          title: m.judul,
          subject: m.classSubjectTutor.subject.namaMapel,
          createdAt: m.createdAt,
          hasFile: !!m.fileUrl,
          url: url,
          type: type,
        };
      }),
      statistics: {
        submissions: submissionStats,
        subjects,
      },
      todaySchedule: todaySchedule.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.classSubjectTutor.subject.namaMapel,
        tutor: s.classSubjectTutor.tutor.user.nama,
      })),
    });
  } catch (error) {
    console.error("Error fetching student dashboard data:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat dashboard siswa" },
      { status: 500 }
    );
  }
}
