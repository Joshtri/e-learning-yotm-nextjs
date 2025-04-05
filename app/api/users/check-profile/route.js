import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Support both GET and POST methods
export async function GET(req) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const role = url.searchParams.get("role");

  return checkProfile(userId, role);
}

export async function POST(req) {
  const { userId, role } = await req.json();
  return checkProfile(userId, role);
}

// Helper function to check profile
async function checkProfile(userId, role) {
  try {
    console.log("API CHECK PROFILE HIT:", { userId, role });

    if (!userId || !role) {
      return NextResponse.json(
        { hasProfile: false, error: "Missing userId or role" },
        { status: 400 }
      );
    }

    if (role === "TUTOR") {
      const tutor = await prisma.tutor.findUnique({ where: { userId } });
      return NextResponse.json({ hasProfile: !!tutor });
    }

    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId } });
      return NextResponse.json({ hasProfile: !!student });
    }

    // Admin always OK
    return NextResponse.json({ hasProfile: true });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { hasProfile: false, error: "Failed to check profile" },
      { status: 500 }
    );
  }
}
