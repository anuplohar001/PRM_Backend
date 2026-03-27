/*
  Warnings:

  - The values [UPDATE_ORG,DELETE_ORG] on the enum `Action` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Action_new" AS ENUM ('ORG_OWNER_ACTIONS', 'ORG_ADMIN_ACTIONS', 'PROJECT_ADMIN_ACTIONS', 'TEAM_ADMIN_ACTIONS', 'TEAM_MEMBER_ACTIONS');
ALTER TABLE "policies" ALTER COLUMN "permissions" TYPE "Action_new"[] USING ("permissions"::text::"Action_new"[]);
ALTER TYPE "Action" RENAME TO "Action_old";
ALTER TYPE "Action_new" RENAME TO "Action";
DROP TYPE "public"."Action_old";
COMMIT;
