/*
  Warnings:

  - A unique constraint covering the columns `[resourceId,targetId,resource]` on the table `policies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "policies_resourceId_targetId_resource_key" ON "policies"("resourceId", "targetId", "resource");
