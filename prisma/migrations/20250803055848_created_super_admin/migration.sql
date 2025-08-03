-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "noOfVacancies" INTEGER DEFAULT 1,
ADD COLUMN     "serviceAgreement" INTEGER DEFAULT 0;
