import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const { user, error } = await getAuthUser(request);

  // Tetap lanjut logout walau token invalid
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Hapus cookie 'auth_token'
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  // Jika user valid, log aktivitas logout
  if (user) {
    try {
      await prisma.log.create({
        data: {
          userId: user.id,
          action: "LOGOUT",
          metadata: {
            userAgent: request.headers.get("user-agent") || "unknown",
            ip: request.headers.get("x-forwarded-for") || "unknown",
          },
        },
      });
    } catch (e) {
      console.error("Gagal mencatat log logout:", e);
    }
  }

  return response;
}
