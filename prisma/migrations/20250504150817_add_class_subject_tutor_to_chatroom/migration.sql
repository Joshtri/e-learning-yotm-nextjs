-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "classSubjectTutorId" TEXT;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_classSubjectTutorId_fkey" FOREIGN KEY ("classSubjectTutorId") REFERENCES "ClassSubjectTutor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
