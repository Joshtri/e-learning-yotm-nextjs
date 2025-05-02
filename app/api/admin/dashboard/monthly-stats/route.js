import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 86400; // Cache for 1 day

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [users, submissions] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { role: true, createdAt: true }
      }),
      prisma.submission.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { status: true, createdAt: true }
      })
    ]);

    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.unshift({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, "MMM yyyy")
      });
    }

    const stats = months.map(month => {
      const usersInMonth = users.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() + 1 === month.month && d.getFullYear() === month.year;
      });
      
      const submissionsInMonth = submissions.filter(s => {
        const d = new Date(s.createdAt);
        return d.getMonth() + 1 === month.month && d.getFullYear() === month.year;
      });

      return {
        label: month.label,
        students: usersInMonth.filter(u => u.role === "STUDENT").length,
        tutors: usersInMonth.filter(u => u.role === "TUTOR").length,
        submitted: submissionsInMonth.filter(s => s.status === "SUBMITTED").length,
        graded: submissionsInMonth.filter(s => s.status === "GRADED").length
      };
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly stats" },
      { status: 500 }
    );
  }
}