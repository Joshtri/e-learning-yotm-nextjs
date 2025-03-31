import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET - List all subjects with optional pagination & search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")?.toLowerCase()

    const skip = (page - 1) * limit

    const where = search
      ? {
          namaMapel: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {}

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { namaMapel: "asc" },
      }),
      prisma.subject.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        subjects,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memuat data mata pelajaran",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// POST - Tambah subject baru
export async function POST(request) {
  try {
    const body = await request.json()
    const { namaMapel, deskripsi } = body

    if (!namaMapel?.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama mapel wajib diisi" },
        { status: 400 }
      )
    }

    const existing = await prisma.subject.findUnique({
      where: {
        namaMapel,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Nama mapel sudah digunakan" },
        { status: 409 }
      )
    }

    const newSubject = await prisma.subject.create({
      data: {
        namaMapel: namaMapel.trim(),
        deskripsi: deskripsi?.trim() || null,
        kodeMapel: null, // bisa nanti di-generate otomatis
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Mata pelajaran berhasil ditambahkan",
        data: newSubject,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan mapel",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
