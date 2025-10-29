import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "secret");

/**
 * PATCH /api/profile
 * Update user profile based on role
 */
export async function PATCH(request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    let payload;
    try {
      const { payload: decoded } = await jwtVerify(token, SECRET_KEY);
      payload = decoded;
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = payload.id;
    const userRole = payload.role;

    // Get form data
    const body = await request.json();
    const {
      nama,
      email,
      // Student fields
      namaLengkap,
      nisn,
      nis,
      jenisKelamin,
      tempatLahir,
      tanggalLahir,
      noTelepon,
      alamat,
      // Tutor fields
      telepon,
      bio,
      pendidikan,
      pengalaman,
    } = body;

    // Validasi basic
    if (!nama || !email) {
      return NextResponse.json(
        { success: false, message: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }

    // Check if email already exists for other users
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah digunakan oleh user lain" },
        { status: 400 }
      );
    }

    // Update User table (common for all roles)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nama,
        email,
      },
    });

    // Update berdasarkan role
    if (userRole === "STUDENT") {
      // Validasi NISN untuk student
      if (!nisn) {
        return NextResponse.json(
          { success: false, message: "NISN wajib diisi untuk siswa" },
          { status: 400 }
        );
      }

      // Check if NISN already exists for other students
      const existingStudent = await prisma.student.findFirst({
        where: {
          nisn,
          NOT: {
            userId,
          },
        },
      });

      if (existingStudent) {
        return NextResponse.json(
          { success: false, message: "NISN sudah digunakan oleh siswa lain" },
          { status: 400 }
        );
      }

      // Update Student table
      await prisma.student.update({
        where: { userId },
        data: {
          namaLengkap: namaLengkap || nama,
          nisn,
          nis: nis || null,
          jenisKelamin: jenisKelamin || null,
          tempatLahir: tempatLahir || null,
          tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
          noTelepon: noTelepon || null,
          alamat: alamat || null,
        },
      });
    } else if (userRole === "TUTOR") {
      // Validasi nama lengkap untuk tutor
      if (!namaLengkap) {
        return NextResponse.json(
          { success: false, message: "Nama lengkap wajib diisi untuk tutor" },
          { status: 400 }
        );
      }

      // Update Tutor table
      await prisma.tutor.update({
        where: { userId },
        data: {
          namaLengkap,
          telepon: telepon || null,
          bio: bio || null,
          pendidikan: pendidikan || null,
          pengalaman: pengalaman || null,
        },
      });
    }
    // ADMIN dan HOMEROOM_TEACHER hanya update User table

    return NextResponse.json(
      {
        success: true,
        message: "Profil berhasil diperbarui",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui profil",
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
