-- CreateTable
CREATE TABLE "DiscussionRoom" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('dsr_', gen_random_uuid()),
    "classSubjectTutorId" TEXT NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionMessage" (
    "id" VARCHAR(40) NOT NULL DEFAULT concat('dsm_', gen_random_uuid()),
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "isiPesan" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscussionRoom_classSubjectTutorId_idx" ON "DiscussionRoom"("classSubjectTutorId");

-- CreateIndex
CREATE INDEX "DiscussionMessage_roomId_idx" ON "DiscussionMessage"("roomId");

-- CreateIndex
CREATE INDEX "DiscussionMessage_senderId_idx" ON "DiscussionMessage"("senderId");

-- AddForeignKey
ALTER TABLE "DiscussionRoom" ADD CONSTRAINT "DiscussionRoom_classSubjectTutorId_fkey" FOREIGN KEY ("classSubjectTutorId") REFERENCES "ClassSubjectTutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionRoom" ADD CONSTRAINT "DiscussionRoom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "DiscussionRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
