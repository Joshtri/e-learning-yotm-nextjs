import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcryptjs from "bcryptjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "File CSV tidak ditemukan" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const expectedHeaders = ["nama", "email", "password", "role"];

    const isHeaderValid = expectedHeaders.every((h) => header.includes(h));
    if (!isHeaderValid) {
      return NextResponse.json(
        {
          success: false,
          message: `Header CSV tidak valid. Harus mengandung: ${expectedHeaders.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const usersToCreate = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());
      const user = {};
      header.forEach((key, idx) => {
        user[key] = values[idx];
      });

      const { nama, email, password, role } = user;

      if (!nama || !email || !password || !role) {
        continue; // skip baris yang tidak lengkap
      }

      const hashedPassword = await bcryptjs.hash(password, 10);

      usersToCreate.push({
        nama,
        email,
        password: hashedPassword,
        role,
        status: "ACTIVE",
      });
    }

    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: usersToCreate.map((u) => u.email),
        },
      },
      select: { email: true },
    });

    const existingEmails = new Set(existingUsers.map((u) => u.email));
    const filteredUsers = usersToCreate.filter(
      (u) => !existingEmails.has(u.email)
    );

    if (filteredUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Semua email sudah terdaftar",
      });
    }

    await prisma.user.createMany({
      data: filteredUsers,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${filteredUsers.length} pengguna`,
    });
  } catch (error) {
    console.error("Gagal import pengguna:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat import pengguna",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
