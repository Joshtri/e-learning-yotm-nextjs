import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { naikKelas, nilaiAkhir } = body;

    // Validate id
    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "ID is required",
        }),
        { status: 400 }
      );
    }

    // Check if history exists
    const existingHistory = await prisma.studentClassHistory.findUnique({
      where: { id },
    });

    if (!existingHistory) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Student history not found",
        }),
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (naikKelas !== undefined) {
      updateData.naikKelas = Boolean(naikKelas);
    }
    if (nilaiAkhir !== undefined) {
      updateData.nilaiAkhir = parseFloat(nilaiAkhir);
    }

    // Update the history
    const updatedHistory = await prisma.studentClassHistory.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            namaLengkap: true,
            nisn: true,
            user: { select: { nama: true, email: true } },
          },
        },
        class: {
          select: {
            id: true,
            namaKelas: true,
            program: { select: { namaPaket: true } },
          },
        },
        academicYear: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { history: updatedHistory },
        message: "Student history updated successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating student history:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
