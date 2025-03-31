/*
  Warnings:

  - You are about to drop the column `peran` on the `User` table. All the data in the column will be lost.
  - Added the required column `role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_peran_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "peran",
ADD COLUMN     "role" "Role" NOT NULL;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
