-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'HOMEROOM_TEACHER';

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "homeroomTeacherId" TEXT;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Tutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
