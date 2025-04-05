import { NextResponse } from "next/server";

export async function POST() {
  // Hapus token dari cookie (misal bernama 'token')
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  // Clear cookie 'token'
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // langsung expired
    path: "/",
  });

  return response;
}
