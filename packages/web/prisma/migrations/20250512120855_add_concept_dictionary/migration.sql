-- CreateTable
CREATE TABLE "ConceptDictionary" (
    "id" TEXT NOT NULL,
    "termChinese" TEXT NOT NULL,
    "termEnglish" TEXT NOT NULL,
    "descChinese" TEXT NOT NULL,
    "descEnglish" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "ConceptDictionary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConceptDictionary" ADD CONSTRAINT "ConceptDictionary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
