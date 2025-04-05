import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request, context) {
    try {
        const id = context.params.id;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "ID tahun ajaran diperlukan" },
                { status: 400 }
            );
        }

        // Nonaktifkan semua tahun ajaran terlebih dahulu
        await prisma.academicYear.updateMany({
            data: { isActive: false },
        });

        // Aktifkan tahun ajaran yang dipilih
        const updated = await prisma.academicYear.update({
            where: { id },
            data: { isActive: true },
        });

        return NextResponse.json({
            success: true,
            message: "Status tahun ajaran diperbarui",
            data: updated,
        });
    } catch (error) {
        console.error("Gagal update tahun ajaran aktif:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat mengubah status",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
