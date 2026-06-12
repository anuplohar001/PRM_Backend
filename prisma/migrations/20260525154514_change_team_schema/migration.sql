/*
  Warnings:

  - You are about to drop the column `projectId` on the `Team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_projectId_fkey";

-- DropIndex
DROP INDEX "Team_projectId_idx";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "projectId";
