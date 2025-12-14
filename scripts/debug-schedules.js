const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const schedules = await prisma.schedule.findMany({
        select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            classSubjectTutor: {
                select: {
                    subject: { select: { namaMapel: true } }
                }
            }
        }
    });

    console.log("Found " + schedules.length + " schedules.");
    schedules.forEach(s => {
        console.log(`[${s.id}] ${s.classSubjectTutor.subject.namaMapel} Day:${s.dayOfWeek}`);
        console.log(`  Start: ${s.startTime.toISOString()}`);
        console.log(`  End:   ${s.endTime.toISOString()}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
