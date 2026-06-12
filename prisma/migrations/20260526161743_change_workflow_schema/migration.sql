-- AlterTable
CREATE SEQUENCE workflow_teamid_seq;
ALTER TABLE "WorkFlow" ALTER COLUMN "teamId" SET DEFAULT nextval('workflow_teamid_seq');
ALTER SEQUENCE workflow_teamid_seq OWNED BY "WorkFlow"."teamId";
