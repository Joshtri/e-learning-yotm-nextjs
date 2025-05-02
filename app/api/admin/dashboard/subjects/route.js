import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";

export const revalidate = 86400; // Cache for 1 day

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      include: {
        classSubjectTutors: {
          include: {
            class: {
              include: {
                students: { select: { id: true } }
              }
            }
          }
        }
      }
    });

    const stats = subjects.map(subject => ({
      id: subject.id,
      name: subject.namaMapel,
      code: subject.kodeMapel,
      totalClasses: subject.classSubjectTutors.length,
      totalStudents: subject.classSubjectTutors.reduce(
        (sum, cst) => sum + cst.class.students.length,
        0
      )
    }));

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching subject stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject statistics" },
      { status: 500 }
    );
  }
}