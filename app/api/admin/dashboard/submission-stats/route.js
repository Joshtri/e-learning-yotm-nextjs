import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 1800; // Cache for 30 minutes

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await prisma.submission.findMany({
      select: { status: true, nilai: true }
    });

    const stats = {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === "SUBMITTED").length,
      graded: submissions.filter(s => s.status === "GRADED").length,
      late: submissions.filter(s => s.status === "LATE").length,
      notStarted: submissions.filter(s => s.status === "NOT_STARTED").length,
      inProgress: submissions.filter(s => s.status === "IN_PROGRESS").length,
      averageScore: submissions.filter(s => s.nilai !== null).length > 0
        ? submissions.filter(s => s.nilai !== null)
            .reduce((sum, s) => sum + s.nilai, 0) / 
          submissions.filter(s => s.nilai !== null).length
        : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching submission stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission stats" },
      { status: 500 }
    );
  }
}