import prisma from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        academicYear: true,
        program: true,
        students: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!classData) {
      return new Response(
        JSON.stringify({ success: false, message: "Kelas tidak ditemukan" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: classData }), {
      status: 200,
    });
  } catch (err) {
    console.error("Gagal memuat detail kelas:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal memuat detail kelas" }),
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id]
export async function PATCH(req, context) {
  const { id } = context.params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "ID kelas tidak ditemukan" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { namaKelas, programId, academicYearId, homeroomTeacherId } = body;

    const updated = await prisma.class.update({
      where: { id },
      data: {
        namaKelas,
        programId,
        academicYearId,
        homeroomTeacherId: homeroomTeacherId || null,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Kelas berhasil diperbarui",
        data: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal update kelas:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal update kelas" }),
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id]
export async function DELETE(req, context) {
  const { id } = context.params;

  if (!id) {
    return new Response(
      JSON.stringify({ success: false, message: "ID kelas tidak ditemukan" }),
      { status: 400 }
    );
  }

  try {
    await prisma.class.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Kelas berhasil dihapus",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Gagal menghapus kelas:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Gagal menghapus kelas" }),
      { status: 500 }
    );
  }
}
