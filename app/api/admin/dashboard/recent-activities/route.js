import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 600; // Cache for 10 minutes (frequently updated)

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [submissions, newUsers] = await Promise.all([
      prisma.submission.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { user: { select: { nama: true } } } },
          assignment: { select: { judul: true } },
          quiz: { select: { judul: true } }
        }
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nama: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    const activities = [
      ...submissions.map(s => ({
        type: "submission",
        title: s.assignment?.judul || s.quiz?.judul || "Untitled",
        user: s.student.user.nama,
        status: s.status,
        date: s.createdAt
      })),
      ...newUsers.map(u => ({
        type: "new_user",
        title: `New ${u.role.toLowerCase()} registered`,
        user: u.nama,
        status: "ACTIVE",
        date: u.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activities" },
      { status: 500 }
    );
  }
}