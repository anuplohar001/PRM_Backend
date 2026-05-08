-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE_TASK', 'ASSIGN_TASK', 'UPDATE_TASK', 'DELETE_TASK');

-- CreateEnum
CREATE TYPE "VisibilityType" AS ENUM ('PRIVATE', 'PROJECT', 'CUSTOM');

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "action" "ActionType" NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" INTEGER,
    "entityType" TEXT,
    "projectId" INTEGER,
    "visibilityType" "VisibilityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityVisibility" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ActivityVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_actorId_createdAt_idx" ON "Activity"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_projectId_createdAt_idx" ON "Activity"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityVisibility_userId_idx" ON "ActivityVisibility"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVisibility_activityId_userId_key" ON "ActivityVisibility"("activityId", "userId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityVisibility" ADD CONSTRAINT "ActivityVisibility_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityVisibility" ADD CONSTRAINT "ActivityVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
