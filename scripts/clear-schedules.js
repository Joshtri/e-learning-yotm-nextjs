const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.schedule.deleteMany({});
    console.log("All schedules deleted.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
