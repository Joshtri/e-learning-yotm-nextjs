import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await getUserFromCookie();

        if (!user || user.role !== "STUDENT") {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const student = await prisma.student.findUnique({
            where: { userId: user.id },
            select: { id: true, classId: true },
        });

        if (!student?.classId) {
            return NextResponse.json(
                { success: false, message: "Data siswa tidak valid atau belum masuk kelas." },
                { status: 400 }
            );
        }

        // Ambil info kelas & tahun ajaran
        const classInfo = await prisma.class.findUnique({
            where: { id: student.classId },
            include: {
                academicYear: true,
                program: true,
            },
        });

        const roster = await prisma.schedule.findMany({
            where: {
                classSubjectTutor: {
                    classId: student.classId,
                },
            },
            include: {
                classSubjectTutor: {
                    include: {
                        subject: { select: { namaMapel: true, kodeMapel: true } },
                        tutor: { include: { user: { select: { nama: true } } } },
                    },
                },
            },
            orderBy: { startTime: "asc" },
        });

        // Group by dayOfWeek (1=Senin, ..., 7=Minggu)
        const groupedRoster = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
        };

        roster.forEach((item) => {
            if (groupedRoster[item.dayOfWeek]) {
                groupedRoster[item.dayOfWeek].push({
                    id: item.id,
                    subjectName: item.classSubjectTutor.subject.namaMapel,
                    courseCode: item.classSubjectTutor.subject.kodeMapel,
                    tutorName: item.classSubjectTutor.tutor.user.nama,
                    startTime: item.startTime,
                    endTime: item.endTime,
                });
            }
        });

        return NextResponse.json({
            success: true,
            data: groupedRoster,
            classInfo: {
                className: classInfo?.namaKelas,
                program: classInfo?.program?.namaPaket,
                academicYear: `${classInfo?.academicYear?.tahunMulai}/${classInfo?.academicYear?.tahunSelesai}`,
                semester: classInfo?.academicYear?.semester,
            },
        });
    } catch (error) {
        console.error("GET /student/roster error:", error);
        return NextResponse.json(
            { success: false, message: "Gagal memuat jadwal pelajaran" },
            { status: 500 }
        );
    }
}
