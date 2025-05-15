-- CreateTable
CREATE TABLE "ApiResource" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceHttpMethod" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "methodName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,

    CONSTRAINT "ApiResource_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApiResource" ADD CONSTRAINT "ApiResource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
