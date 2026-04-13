-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "updatedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
