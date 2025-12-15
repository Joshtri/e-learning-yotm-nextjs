import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import { NextResponse } from "next/server";

export async function DELETE(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params; // Schedule ID

        await prisma.schedule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: "Jadwal dihapus" });
    } catch (error) {
        console.error("Delete schedule error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await getUserFromCookie();
        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;
        const body = await req.json();
        const { classSubjectTutorId, dayOfWeek, startTime, endTime } = body;

        if (!classSubjectTutorId || !dayOfWeek || !startTime || !endTime) {
            return NextResponse.json({ success: false, message: "Incomplete data" }, { status: 400 });
        }

        const [startH, startM] = startTime.split(":");
        const [endH, endM] = endTime.split(":");
        const startDt = new Date(1970, 0, 1, parseInt(startH), parseInt(startM), 0);
        const endDt = new Date(1970, 0, 1, parseInt(endH), parseInt(endM), 0);

        // 1. Get Tutor ID
        const cst = await prisma.classSubjectTutor.findUnique({
            where: { id: classSubjectTutorId },
            select: { tutorId: true, classId: true }
        });

        if (!cst) {
            return NextResponse.json({ success: false, message: "Invalid Class Subject Tutor ID" }, { status: 400 });
        }

        // 2. Check Duplicate Subject (Exclude current ID)
        const existingSubject = await prisma.schedule.findFirst({
            where: {
                classSubjectTutorId: classSubjectTutorId,
                dayOfWeek: parseInt(dayOfWeek),
                id: { not: id }
            }
        });

        if (existingSubject) {
            return NextResponse.json({ success: false, message: "Mata pelajaran ini sudah dijadwalkan di hari tersebut." }, { status: 400 });
        }

        // 3. Check Overlap (Exclude current ID)
        const conflict = await prisma.schedule.findFirst({
            where: {
                dayOfWeek: parseInt(dayOfWeek),
                classSubjectTutor: { tutorId: cst.tutorId },
                id: { not: id },
                startTime: { lt: endDt },
                endTime: { gt: startDt }
            },
            include: {
                classSubjectTutor: {
                    include: { class: true, subject: true }
                }
            }
        });

        if (conflict) {
            const conflictClass = conflict.classSubjectTutor.class.namaKelas;
            const conflictSubject = conflict.classSubjectTutor.subject.namaMapel;
            const conflictStart = conflict.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const conflictEnd = conflict.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return NextResponse.json({
                success: false,
                message: `Bentrok dengan jadwal TUGAS ANDA yang lain: ${conflictClass} - ${conflictSubject} (${conflictStart} - ${conflictEnd})`
            }, { status: 400 });
        }

        // 4. Check for CLASS Overlap (Two subjects in same class at same time)
        const classConflict = await prisma.schedule.findFirst({
            where: {
                dayOfWeek: parseInt(dayOfWeek),
                classSubjectTutor: {
                    classId: cst.classId // Same Class
                },
                id: { not: id }, // Exclude current
                startTime: { lt: endDt },
                endTime: { gt: startDt }
            },
            include: {
                classSubjectTutor: {
                    include: { subject: true, tutor: true }
                }
            }
        });

        if (classConflict) {
            const conflictSubject = classConflict.classSubjectTutor.subject.namaMapel;
            const conflictTutor = classConflict.classSubjectTutor.tutor.namaLengkap;
            const conflictStart = classConflict.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const conflictEnd = classConflict.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return NextResponse.json({
                success: false,
                message: `Jadwal bentrok dengan mata pelajaran lain di kelas ini: ${conflictSubject} (${conflictTutor}) pada pukul ${conflictStart} - ${conflictEnd}`
            }, { status: 400 });
        }

        // 4. Update
        const updated = await prisma.schedule.update({
            where: { id },
            data: {
                classSubjectTutorId,
                dayOfWeek: parseInt(dayOfWeek),
                startTime: startDt,
                endTime: endDt,
            }
        });

        return NextResponse.json({ success: true, data: updated });

    } catch (error) {
        console.error("Update schedule error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
