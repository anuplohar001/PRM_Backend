/*
  Warnings:

  - You are about to drop the column `projectId` on the `WorkFlow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,name]` on the table `WorkFlow` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,position]` on the table `WorkFlow` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "WorkFlow" DROP CONSTRAINT "WorkFlow_projectId_fkey";

-- DropIndex
DROP INDEX "WorkFlow_projectId_name_key";

-- DropIndex
DROP INDEX "WorkFlow_projectId_position_key";

-- AlterTable
ALTER TABLE "WorkFlow" DROP COLUMN "projectId",
ADD COLUMN     "teamId" INTEGER DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_teamId_name_key" ON "WorkFlow"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_teamId_position_key" ON "WorkFlow"("teamId", "position");

-- AddForeignKey
ALTER TABLE "WorkFlow" ADD CONSTRAINT "WorkFlow_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
