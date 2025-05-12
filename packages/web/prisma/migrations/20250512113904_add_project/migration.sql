-- AlterTable
ALTER TABLE "CodeAnalysis" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Guideline" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "liveUrl" TEXT,
    "gitUrl" TEXT NOT NULL,
    "jiraUrl" TEXT,
    "jenkinsUrl" TEXT,
    "devOpsInfo" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodeAnalysis" ADD CONSTRAINT "CodeAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guideline" ADD CONSTRAINT "Guideline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
