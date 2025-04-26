import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        const data = await prisma.classSubjectTutor.findUnique({
            where: { id },
            include: {
                class: true,
                subject: true,
                tutor: true,
            },
        });

        if (!data) {
            return NextResponse.json({
                success: false,
                message: "Data tidak ditemukan",
                data: null
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data,
            message: "Data berhasil diambil"
        });
    } catch (error) {
        console.error("[API][GET]/class-subject-tutors/[id]", error);
        return NextResponse.json({
            success: false,
            message: "Terjadi kesalahan pada server",
            data: null
        }, { status: 500 });
    }
}


export async function PUT(req, { params }) {
    const { id } = await params;
  
    try {
      const body = await req.json();
      const { classId, subjectId, tutorId } = body;
  
      if (!classId || !subjectId || !tutorId) {
        return NextResponse.json(
          { message: "Semua field (classId, subjectId, tutorId) wajib diisi" },
          { status: 400 }
        );
      }
  
      // Pastikan kombinasi unik tidak bentrok dengan data lain
      const existing = await prisma.classSubjectTutor.findFirst({
        where: {
          classId,
          subjectId,
          tutorId,
          NOT: { id }, // exclude current data
        },
      });
  
      if (existing) {
        return NextResponse.json(
          { message: "Kombinasi kelas, mapel, dan tutor sudah digunakan" },
          { status: 409 }
        );
      }
  
      const updated = await prisma.classSubjectTutor.update({
        where: { id },
        data: {
          classId,
          subjectId,
          tutorId,
        },
      });
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error("PUT /class-subject-tutors/[id] error:", error);
      return NextResponse.json(
        { message: "Terjadi kesalahan pada server" },
        { status: 500 }
      );
    }
  }