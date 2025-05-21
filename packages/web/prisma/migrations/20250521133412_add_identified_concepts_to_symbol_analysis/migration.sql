-- AlterTable
ALTER TABLE "SymbolAnalysis" ADD COLUMN     "identifiedConcepts" TEXT[] DEFAULT ARRAY[]::TEXT[];
