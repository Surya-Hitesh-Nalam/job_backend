/*
  Warnings:

  - You are about to drop the column `collegeId` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CptEligibility" AS ENUM ('CPT', 'NON_CPT', 'BOTH');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cptEligibility" "CptEligibility" NOT NULL DEFAULT 'BOTH';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "collegeId",
ADD COLUMN     "isCPT" BOOLEAN NOT NULL DEFAULT false;
