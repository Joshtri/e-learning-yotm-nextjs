/*
  Warnings:

  - You are about to drop the column `tersediaDari` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `tersediaHingga` on the `Assignment` table. All the data in the column will be lost.
  - Added the required column `waktuMulai` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `waktuSelesai` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "tersediaDari",
DROP COLUMN "tersediaHingga",
ADD COLUMN     "waktuMulai" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "waktuSelesai" TIMESTAMP(3) NOT NULL;
