import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TUTOR") {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            classSubjectTutorId,
            tanggal,
            startTime,
            endTime,
            meetingNumber,
            academicYearId,
        } = body;

        // Validate required fields
        if (
            !classSubjectTutorId ||
            !tanggal ||
            !startTime ||
            !endTime ||
            !meetingNumber ||
            !academicYearId
        ) {
            return NextResponse.json(
                { success: false, message: "Semua field wajib diisi" },
                { status: 400 }
            );
        }

        // Get class subject tutor details
        const classSubjectTutor = await prisma.classSubjectTutor.findUnique({
            where: { id: classSubjectTutorId },
            include: {
                class: true,
                subject: true,
                tutor: true,
            },
        });

        if (!classSubjectTutor) {
            return NextResponse.json(
                { success: false, message: "Data kelas tidak ditemukan" },
                { status: 404 }
            );
        }

        // Check if session with same meeting number already exists
        const existingSession = await prisma.attendanceSession.findFirst({
            where: {
                classId: classSubjectTutor.classId,
                subjectId: classSubjectTutor.subjectId,
                academicYearId: academicYearId,
                meetingNumber: parseInt(meetingNumber),
            },
        });

        if (existingSession) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Sesi pertemuan ke-${meetingNumber} sudah ada untuk mata pelajaran ini`,
                },
                { status: 400 }
            );
        }

        // Create new attendance session
        const newSession = await prisma.attendanceSession.create({
            data: {
                classId: classSubjectTutor.classId,
                academicYearId: academicYearId,
                subjectId: classSubjectTutor.subjectId,
                tutorId: classSubjectTutor.tutorId,
                meetingNumber: parseInt(meetingNumber),
                tanggal: new Date(tanggal),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status: "TERJADWALKAN",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Sesi berhasil ditambahkan",
            data: newSession,
        });
    } catch (error) {
        console.error("Error creating session:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Gagal menambahkan sesi",
            },
            { status: 500 }
        );
    }
}
