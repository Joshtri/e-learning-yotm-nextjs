import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import bcryptjs from "bcryptjs";

// GET /api/users/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const userData = await prisma.user.findUnique({
      where: { id },
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
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id]
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { user, error, status } = await getAuthUser(request);

    if (error) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    if (user.role !== "ADMIN" && user.id !== id) {
      return NextResponse.json(
        { success: false, message: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nama, email, password, role, status: userStatus } = body;

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (email) updateData.email = email;

    if (password) {
      const salt = await bcryptjs.genSalt(10);
      updateData.password = await bcryptjs.hash(password, salt);
    }

    if (user.role === "ADMIN") {
      if (role) updateData.role = role;
      if (userStatus) updateData.status = userStatus;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Email already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { user, error, status } = await getAuthUser(request, ["ADMIN"]);

    if (error) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (existingUser.role === "STUDENT") {
      await prisma.student.delete({ where: { userId: id } });
    } else if (existingUser.role === "TUTOR") {
      await prisma.tutor.delete({ where: { userId: id } });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
