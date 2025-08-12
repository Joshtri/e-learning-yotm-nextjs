import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const url = new URL(request.url)

    // parse & sanitize query
    let page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limitParam = url.searchParams.get("limit")
    let limit = typeof limitParam === "string" ? parseInt(limitParam) : 10
    if (Number.isNaN(limit)) limit = 10
    const searchRaw = url.searchParams.get("search") || ""
    const search = searchRaw.trim()

    // where (search di program.namaPaket / subject.namaMapel)
    const where =
      search.length > 0
        ? {
            OR: [
              { program: { is: { namaPaket: { contains: search, mode: "insensitive" } } } },
              { subject: { is: { namaMapel: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : undefined

    // total terlebih dulu
    const total = await prisma.programSubject.count({ where })

    // hitung pages
    const pages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1

    // jika page > pages, geser ke halaman terakhir yang valid
    if (limit > 0 && total > 0 && page > pages) page = pages

    // query list
    const findOptions = {
      where,
      include: {
        program: { select: { id: true, namaPaket: true } },
        subject: { select: { id: true, namaMapel: true } },
      },
      orderBy: { createdAt: "desc" },
    }

    if (limit > 0) {
      findOptions.take = limit
      findOptions.skip = (page - 1) * limit
    }
    // limit <= 0 => ambil semua (tanpa take/skip)

    const programSubjects = await prisma.programSubject.findMany(findOptions)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          programSubjects,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Gagal GET program-subject:", error)
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat data" }),
      { status: 500 }
    )
  }
}


// POST: Tambah relasi baru Program ↔️ Subject
export async function POST(request) {
  try {
    const { programId, subjectId } = await request.json()

    if (!programId || !subjectId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Program dan mata pelajaran wajib dipilih',
        }),
        { status: 400 }
      )
    }

    // Cek duplikasi
    const existing = await prisma.programSubject.findFirst({
      where: { programId, subjectId },
    })

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Mata pelajaran sudah ditambahkan ke program ini',
        }),
        { status: 409 }
      )
    }

    const created = await prisma.programSubject.create({
      data: { programId, subjectId },
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: created,
        message: 'Relasi berhasil ditambahkan',
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Gagal POST program-subject:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Gagal menyimpan data',
        error: error.message,
      }),
      { status: 500 }
    )
  }
}
