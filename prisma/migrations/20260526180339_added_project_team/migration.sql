-- CreateTable
CREATE TABLE "project_teams" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "assignedById" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_teams_projectId_idx" ON "project_teams"("projectId");

-- CreateIndex
CREATE INDEX "project_teams_teamId_idx" ON "project_teams"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "project_teams_projectId_teamId_key" ON "project_teams"("projectId", "teamId");

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
