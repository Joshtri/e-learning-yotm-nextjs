import  prisma  from '@/lib/prisma'

export async function GET(req, context) {
  const { id } = context.params

  try {
    const material = await prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { namaKelas: true } },
            subject: { select: { namaMapel: true } },
            tutor: { select: { namaLengkap: true } },
          },
        },
        attachments: true,
      },
    })

    if (!material) {
      return new Response(JSON.stringify({ success: false, message: 'Materi tidak ditemukan' }), {
        status: 404,
      })
    }

    return new Response(JSON.stringify({ success: true, data: material }), {
      status: 200,
    })
  } catch (error) {
    console.error('Gagal GET materi detail:', error)
    return new Response(JSON.stringify({ success: false, message: 'Gagal memuat data' }), {
      status: 500,
    })
  }
}
