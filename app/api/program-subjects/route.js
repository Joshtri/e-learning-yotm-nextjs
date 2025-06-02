import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const limitParam = url.searchParams.get('limit')
    let limit = limitParam ? parseInt(limitParam) : 10

    const search = url.searchParams.get('search') || ''

    const findOptions = {
      include: {
        program: { select: { id: true, namaPaket: true } },
        subject: { select: { id: true, namaMapel: true } },
      },
      orderBy: { createdAt: 'desc' },
    }

    if (limit <= 0) {
      // ambil semua data tanpa limit dan skip
    } else {
      findOptions.take = limit
      findOptions.skip = (page - 1) * limit
    }

    if (search) {
      findOptions.where = {
        OR: [
          { program: { namaPaket: { contains: search, mode: 'insensitive' } } },
          { subject: { namaMapel: { contains: search, mode: 'insensitive' } } },
        ],
      }
    }

    const programSubjects = await prisma.programSubject.findMany(findOptions)

    return new Response(
      JSON.stringify({
        success: true,
        data: { programSubjects },
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Gagal GET program-subject:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Gagal memuat data',
      }),
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
