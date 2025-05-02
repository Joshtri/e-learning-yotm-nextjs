import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 1800; // Cache for 30 minutes (more frequently changing)

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [assignments, quizzes] = await Promise.all([
      prisma.assignment.findMany({
        where: {
          waktuMulai: { lte: tomorrow },
          waktuSelesai: { gte: today }
        },
        include: {
          classSubjectTutor: {
            include: {
              class: true,
              subject: true,
              tutor: { include: { user: { select: { nama: true } } } }
            }
          }
        }
      }),
      prisma.quiz.findMany({
        where: {
          waktuMulai: { lte: tomorrow },
          waktuSelesai: { gte: today }
        },
        include: {
          classSubjectTutor: {
            include: {
              class: true,
              subject: true,
              tutor: { include: { user: { select: { nama: true } } } }
            }
          }
        }
      })
    ]);

    const schedule = [
      ...assignments.map(a => ({
        type: "assignment",
        title: a.judul,
        subject: a.classSubjectTutor.subject.namaMapel,
        class: a.classSubjectTutor.class.namaKelas,
        tutor: a.classSubjectTutor.tutor.user.nama,
        startTime: a.waktuMulai,
        endTime: a.waktuSelesai
      })),
      ...quizzes.map(q => ({
        type: "quiz",
        title: q.judul,
        subject: q.classSubjectTutor.subject.namaMapel,
        class: q.classSubjectTutor.class.namaKelas,
        tutor: q.classSubjectTutor.tutor.user.nama,
        startTime: q.waktuMulai,
        endTime: q.waktuSelesai,
        duration: q.durasiMenit
      }))
    ].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching today's schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's schedule" },
      { status: 500 }
    );
  }
}