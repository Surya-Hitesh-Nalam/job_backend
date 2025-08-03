-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "serviceAgreement" DROP DEFAULT,
ALTER COLUMN "serviceAgreement" SET DATA TYPE TEXT;
