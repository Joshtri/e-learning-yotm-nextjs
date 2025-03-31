import { createApiResponse } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - List akun user dengan role STUDENT yang belum punya profil Student
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        student: null, // hanya yang belum punya profil student
      },
      select: {
        id: true,
        nama: true,
        email: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    return createApiResponse({ users }); // JANGAN bungkus lagi di { success, data }

    // return createApiResponse({ 
    //   success: true,
    //   data: { users } // Pastikan struktur respons sesuai dengan yang diharapkan di frontend
    // });
  } catch (error) {
    console.error("Error fetching student accounts:", error);
    return createApiResponse(
      { success: false }, 
      "Failed to fetch student accounts", 
      500
    );
  }
}