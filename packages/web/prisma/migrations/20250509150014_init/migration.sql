-- CreateTable
CREATE TABLE "CodeAnalysis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "interfaceAnalysis" JSONB NOT NULL,
    "extensionAnalysis" JSONB NOT NULL,
    "markdownAnalysis" JSONB,

    CONSTRAINT "CodeAnalysis_pkey" PRIMARY KEY ("id")
);
