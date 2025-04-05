/*
  Warnings:

  - You are about to drop the `MaterialAttachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MaterialAttachment" DROP CONSTRAINT "MaterialAttachment_materialId_fkey";

-- AlterTable
ALTER TABLE "AnswerOption" ADD COLUMN     "kode" TEXT;

-- DropTable
DROP TABLE "MaterialAttachment";
