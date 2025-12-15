import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { sessionId } = params;

        const session = await prisma.attendanceSession.findUnique({
            where: { id: sessionId },
            include: {
                subject: true,
                tutor: true,
                class: true,
                academicYear: true,
                attendances: {
                    include: {
                        student: { select: { id: true, namaLengkap: true, nisn: true } }
                    }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ success: false, message: "Sesi tidak ditemukan" }, { status: 404 });
        }

        // Fetch all students in the class to ensure complete list
        const allStudents = await prisma.student.findMany({
            where: { classId: session.classId },
            select: { id: true, namaLengkap: true, nisn: true },
            orderBy: { namaLengkap: 'asc' }
        });

        // Merge existing attendance records with all students
        const attendanceMap = new Map();
        session.attendances.forEach(att => attendanceMap.set(att.studentId, att));

        const mergedAttendances = allStudents.map(student => {
            const existing = attendanceMap.get(student.id);
            if (existing) return existing;

            // Return virtual/placeholder attendance for students without records
            return {
                id: `temp-${student.id}`, // Temporary ID for frontend keying
                studentId: student.id,
                sessionId: session.id,
                status: null, // Indicates not set
                note: '',
                student: student
            };
        });

        const sessionWithFullAttendance = {
            ...session,
            attendances: mergedAttendances
        };

        return NextResponse.json({ success: true, data: sessionWithFullAttendance });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { sessionId } = params;
        const body = await req.json();
        const { status, tanggal, startTime, endTime, keterangan } = body;

        const updateData = {};

        // Status Update
        if (status) {
            if (!['TERJADWALKAN', 'DIMULAI', 'SELESAI'].includes(status)) {
                return NextResponse.json({ message: "Status tidak valid" }, { status: 400 });
            }
            updateData.status = status;
        }

        // Date/Time Updates
        if (tanggal) updateData.tanggal = new Date(tanggal);
        if (startTime) updateData.startTime = new Date(startTime);
        if (endTime) updateData.endTime = new Date(endTime);
        if (keterangan !== undefined) updateData.keterangan = keterangan;

        const session = await prisma.attendanceSession.update({
            where: { id: sessionId },
            data: updateData,
        });

        return NextResponse.json({ success: true, data: session });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
