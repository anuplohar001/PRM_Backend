/*
  Warnings:

  - The `role` column on the `organization_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrgRoles" AS ENUM ('ORG_ADMIN', 'ORG_OWNER', 'ORG_MEMBER');

-- AlterTable
ALTER TABLE "organization_members" DROP COLUMN "role",
ADD COLUMN     "role" "OrgRoles";
