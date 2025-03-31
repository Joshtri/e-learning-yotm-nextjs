import { NextResponse } from "next/server";
import { getAuthUser, createApiResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";

// GET all users (with pagination and filtering)
export async function GET(request) {
  try {
    // Optional: auth check
    // const { user, error, status } = await getAuthUser(request, ['ADMIN']);
    // if (error) return createApiResponse(null, error, status);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build dynamic filter
    const filter = {};
    if (role) filter.role = role;
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

    return createApiResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return createApiResponse(null, "Failed to fetch users", 500);
  }
}

// POST - Create a new user
export async function POST(request) {
  try {
    // const { user, error, status } = await getAuthUser(request, ["ADMIN"]);
    // if (error) return createApiResponse(null, error, status);

    const body = await request.json();
    const { nama, email, password, role } = body;

    if (!nama || !email || !password || !role) {
      return createApiResponse(null, "Missing required fields", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return createApiResponse(null, "Email already in use", 409);
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

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

    return createApiResponse(newUser, null, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return createApiResponse(null, "Failed to create user", 500);
  }
}
