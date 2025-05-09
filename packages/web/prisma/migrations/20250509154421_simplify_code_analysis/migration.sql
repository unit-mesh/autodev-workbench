/*
  Warnings:

  - You are about to drop the column `extensionAnalysis` on the `CodeAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `interfaceAnalysis` on the `CodeAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `markdownAnalysis` on the `CodeAnalysis` table. All the data in the column will be lost.
  - Added the required column `content` to the `CodeAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `CodeAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- First, clear the existing table
TRUNCATE TABLE "CodeAnalysis";

-- Then modify the table structure
ALTER TABLE "CodeAnalysis" DROP COLUMN IF EXISTS "interfaceAnalysis";
ALTER TABLE "CodeAnalysis" DROP COLUMN IF EXISTS "extensionAnalysis";
ALTER TABLE "CodeAnalysis" DROP COLUMN IF EXISTS "markdownAnalysis";
ALTER TABLE "CodeAnalysis" ADD COLUMN "path" TEXT NOT NULL;
ALTER TABLE "CodeAnalysis" ADD COLUMN "content" TEXT NOT NULL;
