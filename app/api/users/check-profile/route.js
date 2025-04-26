import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");

    return await checkProfile(userId, role);
  } catch (error) {
    console.error("Error in GET /check-profile:", error);
    return NextResponse.json(
      { hasProfile: false, error: "Unexpected error in GET" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId, role } = await req.json();
    return await checkProfile(userId, role);
  } catch (error) {
    console.error("Error in POST /check-profile:", error);
    return NextResponse.json(
      { hasProfile: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}

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
      return NextResponse.json({ hasProfile: Boolean(tutor) });
    }

    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId } });
      return NextResponse.json({ hasProfile: Boolean(student) });
    }

    // Admin or unknown roles assumed always OK
    return NextResponse.json({ hasProfile: true });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { hasProfile: false, error: "Failed to check profile" },
      { status: 500 }
    );
  }
}
