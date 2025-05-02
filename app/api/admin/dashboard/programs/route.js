import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 86400; // Cache for 1 day (less frequently changing data)

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await prisma.program.findMany({
      include: {
        classes: {
          include: {
            students: { select: { id: true } }
          }
        }
      }
    });

    const stats = programs.map(program => ({
      id: program.id,
      name: program.namaPaket,
      totalClasses: program.classes.length,
      totalStudents: program.classes.reduce(
        (sum, cls) => sum + cls.students.length, 
        0
      )
    }));

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching program stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch program statistics" },
      { status: 500 }
    );
  }
}