// /app/api/auth/me/route.js
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const token = cookies().get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
