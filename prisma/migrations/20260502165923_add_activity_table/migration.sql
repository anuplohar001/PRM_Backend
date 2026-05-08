/*
  Warnings:

  - The `entityType` column on the `Activity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('TASK', 'PROJECT', 'TEAM', 'WORKFLOW', 'COMMENT');

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "EntityType";
