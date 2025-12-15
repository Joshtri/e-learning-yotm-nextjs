import prisma from "@/lib/prisma";
import { getUserFromCookie } from "@/utils/auth";
import Holidays from "date-holidays";

export async function POST(req) {
  try {
    const user = await getUserFromCookie();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const { academicYearId, startDate, classSubjectTutorId, sessionCount } = await req.json();

    if (!academicYearId || !startDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tahun Ajaran dan Tanggal Mulai wajib diisi",
        }),
        { status: 400 }
      );
    }

    // Default to 16 if not provided or invalid
    const MAX_MEETINGS = sessionCount ? parseInt(sessionCount) : 16;
    if (isNaN(MAX_MEETINGS) || MAX_MEETINGS < 1) {
      return new Response(
        JSON.stringify({ success: false, message: "Jumlah sesi tidak valid" }),
        { status: 400 }
      );
    }

    if (!classSubjectTutorId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Mata Pelajaran wajib dipilih",
        }),
        { status: 400 }
      );
    }

    // Get tutor
    const tutor = await prisma.tutor.findUnique({
      where: { userId: user.id },
    });

    if (!tutor) {
      return new Response(
        JSON.stringify({ success: false, message: "Tutor not found" }),
        { status: 404 }
      );
    }

    // Find the class where this tutor is homeroom teacher
    const kelas = await prisma.class.findFirst({
      where: {
        homeroomTeacherId: tutor.id,
        academicYearId: academicYearId,
      },
      include: {
        academicYear: true,
      },
    });

    if (!kelas) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Kelas perwalian tidak ditemukan untuk Tahun Ajaran ini"
        }),
        { status: 404 }
      );
    }

    // Fetch specific Subject & Schedule for this class
    const classSubjectTutors = await prisma.classSubjectTutor.findMany({
      where: {
        id: classSubjectTutorId,
        classId: kelas.id
      },
      include: {
        subject: true,
        tutor: true,
        schedules: true, // Our new model
      },
    });

    if (classSubjectTutors.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Mata Pelajaran tidak ditemukan atau bukan milik kelas ini.",
        }),
        { status: 404 }
      );
    }

    const sessionsToCreate = [];
    const startObj = new Date(startDate);
    const hd = new Holidays("ID"); // Optional: Check holidays/Sundays if needed, but per requirement we generate 1-16 "default".
    // Requirement says: "tanggal_pertemuan_n = tanggal_mulai + (n-1) * 7 hari (+ offset day of week)"
    // Actually: "mengikuti day-of-week jadwal"

    let totalCreated = 0;
    let subjectsProcessed = 0;

    for (const cst of classSubjectTutors) {
      // If no schedule, we can't generate
      if (!cst.schedules || cst.schedules.length === 0) continue;

      subjectsProcessed++;

      // Sort schedules by dayOfWeek to have deterministic order if multiple
      const schedules = cst.schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      // Validate startDate matches one of the schedule days
      // startDate is YYYY-MM-DD string or Date object.
      // Make sure to parse it safely in consistent timezone context if possible, 
      // but usually new Date(startDate) works if ISO string.
      const startObjDate = new Date(startDate);
      const startDayJs = startObjDate.getDay();
      const startDayPrisma = startDayJs === 0 ? 7 : startDayJs; // 1=Mon...7=Sun

      const validDays = schedules.map(s => s.dayOfWeek);
      if (!validDays.includes(startDayPrisma)) {
        const dayNames = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
        const validDayNames = validDays.map(d => dayNames[d]).join(", ");
        const currentDayName = dayNames[startDayPrisma];

        return new Response(JSON.stringify({
          success: false,
          message: `Tanggal mulai (${currentDayName}) tidak sesuai dengan jadwal roster (${validDayNames}).`
        }), { status: 400 });
      }


      // Current logic: For each schedule slot, generate 16 meetings?
      // Or 16 meetings TOTAL for the subject?
      // User Prompt: "Untuk setiap jadwal mapel: Buat sesi presensi Pertemuan 1 sampai 16"
      // This implies each slot gets a series.
      // E.g. Math Mon -> 16 sessions. Math Thu -> 16 sessions.
      // Unique constraint: [classId, subjectId, academicYearId, meetingNumber]
      // This constraint PREVENTS 2 sets of 1..16.
      // So we must INTERLEAVE them or assume only 1 schedule.
      // If multiple schedules exist, we will Generate 1..16 distributed across them.
      // E.g. Schedule 1 (Mon), Schedule 2 (Thu).
      // Meeting 1: Mon Week 1. Meeting 2: Thu Week 1. Meeting 3: Mon Week 2...

      // Let's implement the INTERLEAVED approach as it's the only one fitting the Unique Constraint.

      let meetingCount = 0;
      let currentWeek = 0;

      // We generate up to 16 meetings total for the subject


      while (meetingCount < MAX_MEETINGS) {
        for (const sch of schedules) {
          if (meetingCount >= MAX_MEETINGS) break;

          // Calculate date for this schedule in currentWeek
          // Find the date of 'sch.dayOfWeek' in the week starting 'startObj + currentWeek*7'
          // Wait, we need to align 'startObj' to the first week.
          // Let's say startObj is the "Start Date of Semester".
          // We need to find the specific date corresponding to sch.dayOfWeek.

          // Logic:
          // 1. Get day index of startObj (0=Sun, 1=Mon...).
          // 2. Schedule dayOfWeek (1=Mon..7=Sun). Note: JS getDay is 0-6.
          //    We need to match the user Input dayOfWeek convention.
          //    I defined Schedule.dayOfWeek as 1=Monday, 7=Sunday? 
          //    Let's check prisma model comment: "1=Monday, 7=Sunday".
          //    JS getDay: 0=Sunday, 1=Monday... 
          //    So JS = (Prisma % 7).

          const targetDayJs = sch.dayOfWeek % 7;

          // Date of this meeting in Week 0 offset
          const meetingDate = new Date(startObj);
          meetingDate.setDate(meetingDate.getDate() + (currentWeek * 7));

          // Adjust day
          const currentDayJs = meetingDate.getDay();
          const diff = targetDayJs - currentDayJs; // e.g. Target Mon(1) - Current Sun(0) = 1. Add 1 day.
          // If diff < 0 (e.g. Target Mon(1) - Current Tue(2) = -1), it means the day has passed in this week?
          // "Tanggal Mulai Pertemuan 1" usually implies the start of the academic calendar.
          // If startDate is Monday, and schedule is Tuesday, it's next day.
          // If startDate is Wednesday, and schedule is Monday:
          // Should it be NEXT Monday (Week 2 relative to start date)? Or PREVIOUS Monday (Week 1)?
          // Usually we look FORWARD.
          // If target day < start day, add 7 days?
          // But we are iterating 'currentWeek'.

          // Better approach:
          // Find the FIRST occurance of DayOfWeek >= startObj.
          // that is baseDate.
          // Then add (currentWeek * 7).

          // Actually, if we have multiple schedules, we want them in order.
          // So we should collect all First Occurrences, then iterate.

          // Simplified Implementation for "Generate 1-16":
          // We will just calculate the date simply:
          // meetingDate = startObj + (sch.dayOfWeek - startDayOfWeek + (if < 0 ? 7 : 0)) + week*7

          // But wait, if I have Mon and Thu.
          // Week 0: Mon, Thu.
          // Week 1: Mon, Thu.
          // ...

          // Let's calculate the specific date for this week iteration
          const baseDate = new Date(startObj);
          baseDate.setDate(baseDate.getDate() + (currentWeek * 7));

          const baseDayJs = baseDate.getDay();
          let daysToAdd = targetDayJs - baseDayJs;
          if (daysToAdd < 0) {
            // If the target day is earlier in the week than the start date, 
            // we assume "Week 1" starts FROM startDate.
            // So we move to next week?
            // E.g. Start Wed. Schedule Mon.
            // The "Mon of Week 1" is technically passed? Or is "Mon of NEXT week"?
            // Usually Start Date is Monday. 
            // Let's assume we add 7 days if it's passed, TO KEEP IT IN THE FUTURE.
            daysToAdd += 7;
          }

          // BUT, if we have multiple schedules (Mon, Wed) and startDate is Tue.
          // Wed is +1. Mon is +6.
          // Order: Wed (Meeting 1), Mon (Meeting 2).
          // This seems correct.

          const finalDate = new Date(baseDate);
          finalDate.setDate(finalDate.getDate() + daysToAdd);

          // Time
          const startT = new Date(sch.startTime); // It's a DateTime object in Prisma
          const endT = new Date(sch.endTime);

          // Set time on finalDate
          // Note: sch.startTime has some dummy date component. We only need Time.
          const sTime = new Date(finalDate);
          sTime.setHours(startT.getUTCHours(), startT.getUTCMinutes(), 0, 0);

          const eTime = new Date(finalDate);
          eTime.setHours(endT.getUTCHours(), endT.getUTCMinutes(), 0, 0);

          sessionsToCreate.push({
            classId: kelas.id,
            academicYearId: kelas.academicYearId,
            subjectId: cst.subjectId,
            tutorId: cst.tutorId, // Guru pengajar
            meetingNumber: meetingCount + 1,
            tanggal: sTime, // DateTime
            startTime: sTime,
            endTime: eTime,
            status: 'TERJADWALKAN',
            keterangan: 'Auto Generated',
          });

          meetingCount++;
        }
        currentWeek++;
      }
    }

    // Batch create
    // Use createMany? 
    // AtttendanceSession has Unique constraint on meetingNumber.
    // If we re-generate, we should skipDuplicates or upsert?
    // "skipDuplicates: true" ignores conflicts.
    // Requirement: "Wajib mencegah duplikasi"

    if (sessionsToCreate.length > 0) {
      await prisma.attendanceSession.createMany({
        data: sessionsToCreate,
        skipDuplicates: true,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Berhasil generate presensi untuk ${subjectsProcessed} mata pelajaran.`,
        data: {
          totalSessions: sessionsToCreate.length
        }
      }),
      { status: 201 }
    );

  } catch (error) {
    console.error("Generate error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: error?.message,
      }),
      { status: 500 }
    );
  }
}

