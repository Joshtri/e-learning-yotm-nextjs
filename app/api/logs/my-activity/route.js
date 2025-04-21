import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { user, error, status } = await getAuthUser(request);

  if (error) {
    return NextResponse.json({ logs: [], message: error }, { status });
  }

  try {
    const logs = await prisma.log.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err) {
    console.error("Error fetching logs:", err);
    return NextResponse.json({ logs: [], message: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
