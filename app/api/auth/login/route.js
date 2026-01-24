import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, identifier, password } = body;
    const loginInput = identifier || email;

    if (!loginInput || !password) {
      return NextResponse.json(
        { message: "Missing username/email or password" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginInput },
          { nama: loginInput }
        ]
      },
      select: {
        id: true,
        nama: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { message: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const { password: passwordHash, ...userData } = user;

    const token = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 🟩 Buat log aktivitas
    await prisma.log.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        metadata: {
          email: user.email,
          userAgent: request.headers.get("user-agent") || "unknown",
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      },
    });

    // Set secure cookie
    const response = NextResponse.json({
      user: userData,
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { message: "Login failed. Please try again later." },
      { status: 500 }
    );
  }
}
