/*
  Warnings:

  - The `role` column on the `project_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProjectRoles" AS ENUM ('PROJECT_ADMIN', 'PROJECT_MEMBER');

-- AlterTable
ALTER TABLE "project_members" DROP COLUMN "role",
ADD COLUMN     "role" "ProjectRoles" NOT NULL DEFAULT 'PROJECT_MEMBER';

-- CreateTable
CREATE TABLE "WorkFlow" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkFlow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_projectId_key" ON "WorkFlow"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkFlow_name_key" ON "WorkFlow"("name");

-- AddForeignKey
ALTER TABLE "WorkFlow" ADD CONSTRAINT "WorkFlow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
