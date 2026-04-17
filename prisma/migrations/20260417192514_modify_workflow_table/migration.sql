/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `WorkFlow` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WorkFlow_name_key";

-- DropIndex
DROP INDEX "WorkFlow_projectId_key";

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_projectId_name_key" ON "WorkFlow"("projectId", "name");
