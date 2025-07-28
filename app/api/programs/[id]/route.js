import { createApiResponse, getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET program by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Check authentication
    const { user, error, status } = await getAuthUser(request);

    if (error) {
      return createApiResponse(null, error, status);
    }

    // Get program data
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        classes: {
          select: {
            id: true,
            namaKelas: true,
          },
        },
      },
    });

    if (!program) {
      return createApiResponse(null, "Program not found", 404);
    }

    return createApiResponse(program);
  } catch (error) {
    console.error("Error fetching program:", error);
    return createApiResponse(null, "Failed to fetch program", 500);
  }
}

// PATCH - Update program
export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    // Only admin can update programs
    const { user, error, status } = await getAuthUser(request, ["ADMIN"]);

    if (error) {
      return createApiResponse(null, error, status);
    }

    // Parse request body
    const body = await request.json();
    const { namaPaket } = body;

    // Validate required fields
    if (!namaPaket) {
      return createApiResponse(null, "Program name is required", 400);
    }

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id },
    });

    if (!existingProgram) {
      return createApiResponse(null, "Program not found", 404);
    }

    // Update program
    const updatedProgram = await prisma.program.update({
      where: { id },
      data: {
        namaPaket,
      },
    });

    return createApiResponse(updatedProgram);
  } catch (error) {
    console.error("Error updating program:", error);

    // Handle unique constraint error
    if (error.code === "P2002") {
      return createApiResponse(
        null,
        "Program with this name already exists",
        409
      );
    }

    return createApiResponse(null, "Failed to update program", 500);
  }
}

// DELETE - Delete program
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Only admin can delete programs
    const { user, error, status } = await getAuthUser(request, ["ADMIN"]);

    if (error) {
      return createApiResponse(null, error, status);
    }

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id },
      include: {
        classes: true,
      },
    });

    if (!existingProgram) {
      return createApiResponse(null, "Program not found", 404);
    }

    // Don't allow deletion if program has classes
    if (existingProgram.classes.length > 0) {
      return createApiResponse(
        null,
        "Cannot delete program that has classes. Remove all classes first.",
        400
      );
    }

    // Delete program
    await prisma.program.delete({
      where: { id },
    });

    return createApiResponse({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    return createApiResponse(null, "Failed to delete program", 500);
  }
}
