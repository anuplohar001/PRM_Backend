-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "lastOrganizationId" INTEGER DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_lastOrganizationId_fkey" FOREIGN KEY ("lastOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
