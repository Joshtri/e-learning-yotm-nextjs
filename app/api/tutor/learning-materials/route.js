// /app/api/tutor/learning-materials/route.ts
import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromCookie();

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({
      where: { userId: user.id },
    });

    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId");

    const materials = await prisma.learningMaterial.findMany({
      where: {
        classSubjectTutor: {
          tutorId: tutor.id,
          class: academicYearId
            ? {
                academicYearId,
              }
            : {
                academicYear: {
                  isActive: true,
                },
              },
        },
      },
      include: {
        classSubjectTutor: {
          include: {
            class: true,
            subject: true,
            tutor: {
              select: { namaLengkap: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error("Gagal ambil learning materials:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

// export async function POST(req) {
//   try {
//     const user = await getUserFromCookie();

//     if (!user || user.role !== "TUTOR") {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const tutor = await prisma.tutor.findFirst({
//       where: { userId: user.id },
//     });

//     if (!tutor) {
//       return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
//     }

//     const body = await req.json();
//     const { judul, pertemuan, konten = "", fileUrl = null, classSubjectTutorId } = body;

//     if (!judul || !classSubjectTutorId) {
//       return NextResponse.json(
//         { success: false, message: "Judul dan kelas-mapel wajib diisi" },
//         { status: 400 }
//       );
//     }

//     const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
//       where: {
//         id: classSubjectTutorId,
//         tutorId: tutor.id,
//       },
//       include: {
//         class: {
//           include: { students: { select: { userId: true } } },
//         },
//         subject: true,
//       },
//     });

//     if (!classSubjectTutor) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Anda tidak memiliki akses ke kelas-mapel ini",
//         },
//         { status: 403 }
//       );
//     }

//     const created = await prisma.learningMaterial.create({
//       data: {
//         judul,
//         pertemuan: pertemuan || "1", // Default ke "1" jika tidak ada
//         konten,
//         fileUrl,
//         classSubjectTutorId,
//       },
//     });

//     // Kirim notifikasi ke semua siswa di kelas
//     const studentUserIds = classSubjectTutor.class.students.map(
//       (s) => s.userId
//     );

//     const notificationPayload = studentUserIds.map((studentId) => ({
//       senderId: user.id,
//       receiverId: studentId,
//       title: `Materi Baru: ${judul}`,
//       message: `Tutor Anda menambahkan materi "${judul}" pada mapel ${classSubjectTutor.subject.nama}.`,
//       type: "MATERIAL",
//     }));

//     await prisma.notification.createMany({
//       data: notificationPayload,
//       skipDuplicates: true,
//     });

//     return NextResponse.json({
//       success: true,
//       message: "Materi berhasil disimpan dan notifikasi dikirim",
//       data: created,
//     });
//   } catch (error) {
//     console.error("Gagal simpan materi:", error);
//     return NextResponse.json(
//       { success: false, message: "Terjadi kesalahan server" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user || user.role !== "TUTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { userId: user.id } });
    if (!tutor) {
      return NextResponse.json({ message: "Tutor not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      judul,
      pertemuan,
      konten = "",
      fileUrl = null,
      classSubjectTutorId,
      tipeMateri = "FILE", // <--
      youtubeUrl, // <--
    } = body;

    if (!judul || !classSubjectTutorId) {
      return NextResponse.json(
        { success: false, message: "Judul dan kelas-mapel wajib diisi" },
        { status: 400 }
      );
    }

    if (!["FILE", "LINK_YOUTUBE"].includes(tipeMateri)) {
      return NextResponse.json(
        { success: false, message: "tipeMateri tidak valid" },
        { status: 400 }
      );
    }

    // Validasi akses
    const classSubjectTutor = await prisma.classSubjectTutor.findFirst({
      where: { id: classSubjectTutorId, tutorId: tutor.id },
      include: {
        class: { include: { students: { select: { userId: true } } } },
        subject: true,
      },
    });
    if (!classSubjectTutor) {
      return NextResponse.json(
        {
          success: false,
          message: "Anda tidak memiliki akses ke kelas-mapel ini",
        },
        { status: 403 }
      );
    }

    // Normalisasi sumber materi
    let finalFileUrl = fileUrl;
    if (tipeMateri === "LINK_YOUTUBE") {
      const url = (youtubeUrl || finalFileUrl || "").trim();
      const yt =
        /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=[\w-]{11}|youtu\.be\/[\w-]{11})([^\s]*)?$/i;
      if (!url || !yt.test(url)) {
        return NextResponse.json(
          { success: false, message: "URL YouTube wajib dan harus valid" },
          { status: 400 }
        );
      }
      finalFileUrl = url; // simpan ke fileUrl
    }

    const created = await prisma.learningMaterial.create({
      data: {
        judul,
        pertemuan: pertemuan || "1",
        konten,
        fileUrl: finalFileUrl, // file PDF atau link YouTube
        tipeMateri, // <--
        classSubjectTutorId,
      },
    });

    // Kirim notifikasi ke siswa
    const studentUserIds = classSubjectTutor.class.students.map(
      (s) => s.userId
    );
    const notificationPayload = studentUserIds.map((receiverId) => ({
      senderId: user.id,
      receiverId,
      title: `Materi Baru: ${judul}`,
      message: `Tutor menambahkan materi "${judul}" pada mapel ${classSubjectTutor.subject.nama}.`,
      type: "MATERIAL",
    }));
    await prisma.notification.createMany({
      data: notificationPayload,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: "Materi berhasil disimpan dan notifikasi dikirim",
      data: created,
    });
  } catch (error) {
    console.error("Gagal simpan materi:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
