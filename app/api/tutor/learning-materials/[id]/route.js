// app/api/tutor/learning-materials/[id]/route.js
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

function getUserFromCookie() {
  const token = cookies().get("auth_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// GET detail materi (sertakan pertemuan)
export async function GET(req, { params }) {
  try {
    const { id } = params;
    const material = await prisma.learningMaterial.findUnique({
      where: { id },
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { success: false, message: "Materi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pastikan response mengandung pertemuan
    return NextResponse.json({ success: true, data: material });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail materi" },
      { status: 500 }
    );
  }
}

// PATCH edit materi (termasuk pertemuan)
/**
 * PATCH update materi (judul, konten, fileUrl, pertemuan)
 * - pertemuan disimpan sebagai STRING (nullable)
 * - validasi: bila diisi harus angka >= 1 (tapi tetap disimpan sebagai string)
 */
export async function PATCH(req, { params }) {
  try {
    const user = getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();

    // Pastikan materi milik tutor ini
    const existing = await prisma.learningMaterial.findFirst({
      where: { id, classSubjectTutor: { tutor: { userId: user.id } } },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Materi tidak ditemukan atau Anda tidak memiliki akses",
        },
        { status: 404 }
      );
    }

    // Normalisasi field
    const judul =
      typeof body.judul === "string" ? body.judul.trim() : undefined;
    const konten = typeof body.konten === "string" ? body.konten : undefined;
    const fileUrl =
      typeof body.fileUrl === "string" ? body.fileUrl.trim() : undefined;

    // pertemuan: kirim sebagai string
    // - undefined  -> tidak diubah
    // - "" / null  -> disimpan null
    // - lainnya    -> wajib angka >= 1, disimpan sebagai string
    let pertemuan = undefined;
    if (Object.prototype.hasOwnProperty.call(body, "pertemuan")) {
      if (body.pertemuan === null) {
        pertemuan = null;
      } else {
        const raw = String(body.pertemuan ?? "").trim();
        if (raw === "") {
          pertemuan = null;
        } else {
          // Validasi angka >= 1 (opsional tapi membantu)
          if (!/^\d+$/.test(raw) || Number(raw) < 1) {
            return NextResponse.json(
              { success: false, message: "Pertemuan harus berupa angka ≥ 1." },
              { status: 400 }
            );
          }
          pertemuan = raw; // SIMPAN SEBAGAI STRING
        }
      }
    }

    // Validasi ringan lain
    if (judul !== undefined && !judul) {
      return NextResponse.json(
        { success: false, message: "Judul tidak boleh kosong." },
        { status: 400 }
      );
    }
    if (judul && judul.length > 200) {
      return NextResponse.json(
        { success: false, message: "Judul maksimal 200 karakter." },
        { status: 400 }
      );
    }
    if (fileUrl && fileUrl.length > 255) {
      return NextResponse.json(
        { success: false, message: "fileUrl maksimal 255 karakter." },
        { status: 400 }
      );
    }

    // Build payload update
    const data = {};
    if (judul !== undefined) data.judul = judul;
    if (konten !== undefined) data.konten = konten;
    if (fileUrl !== undefined) data.fileUrl = fileUrl || null;
    if (pertemuan !== undefined) data.pertemuan = pertemuan; // <- STRING/null

    const updated = await prisma.learningMaterial.update({
      where: { id: existing.id },
      data,
      include: {
        classSubjectTutor: {
          include: {
            class: { select: { id: true, namaKelas: true } },
            subject: { select: { id: true, namaMapel: true } },
            tutor: { select: { id: true, namaLengkap: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Materi berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("PATCH learning-material error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui materi",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
