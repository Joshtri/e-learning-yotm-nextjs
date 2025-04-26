// /app/api/auth/me/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }); // ❗️jangan redirect
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("JWT verify error:", error);
    return NextResponse.json({ user: null }); // ❗️jangan redirect
  }
}
