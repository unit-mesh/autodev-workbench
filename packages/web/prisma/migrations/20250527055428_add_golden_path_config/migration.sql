-- CreateTable
CREATE TABLE "GoldenPathConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,

    CONSTRAINT "GoldenPathConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GoldenPathConfig" ADD CONSTRAINT "GoldenPathConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoldenPathConfig" ADD CONSTRAINT "GoldenPathConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
