import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



// GET /api/holidays/ranges/[id] endpoint khusus untuk file dynamic route
export async function GET(id) {
    try {
      const range = await prisma.holidayRange.findUnique({ where: { id } });
  
      if (!range) {
        return NextResponse.json(
          { success: false, message: "Data tidak ditemukan" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ success: true, data: range });
    } catch (error) {
      console.error("GET /api/holidays/ranges/:id error:", error);
      return NextResponse.json(
        { success: false, message: "Gagal memuat data" },
        { status: 500 }
      );
    }
  }
  