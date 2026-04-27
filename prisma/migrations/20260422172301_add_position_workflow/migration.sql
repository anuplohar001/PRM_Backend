/*
  Warnings:

  - A unique constraint covering the columns `[projectId,position]` on the table `WorkFlow` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WorkFlow" ALTER COLUMN "position" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_projectId_position_key" ON "WorkFlow"("projectId", "position");
