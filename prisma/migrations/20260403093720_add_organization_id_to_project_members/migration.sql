-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "organizationId" INTEGER;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
