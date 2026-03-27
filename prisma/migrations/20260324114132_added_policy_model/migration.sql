-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('ORGANIZATION', 'PROJECT', 'TEAM');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('USER');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('ALLOW', 'DECLINE');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "policies" (
    "id" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "resource" "ResourceType" NOT NULL,
    "target" "TargetType" NOT NULL,
    "targetId" INTEGER NOT NULL,
    "effect" "EffectType" NOT NULL,
    "permissions" "Action"[],

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
