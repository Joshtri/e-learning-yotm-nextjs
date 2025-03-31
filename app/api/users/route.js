import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET - List users with pagination & filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const filter = {};

    if (role) {
      filter.role = role;

      if (role === "STUDENT") {
        filter.student = null;
      }
    }

    if (search) {
      filter.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: filter,
        select: {
          id: true,
          nama: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          student: true,
          tutor: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: filter }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request) {
  try {
    const body = await request.json();
    const { nama, email, password, role } = body;

    if (!nama || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE",
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: newUser, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user", error: error.message },
      { status: 500 }
    );
  }
}
