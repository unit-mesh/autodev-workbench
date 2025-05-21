-- AlterTable
ALTER TABLE "ConceptDictionary" ADD COLUMN     "relatedTerms" TEXT[] DEFAULT ARRAY[]::TEXT[];
