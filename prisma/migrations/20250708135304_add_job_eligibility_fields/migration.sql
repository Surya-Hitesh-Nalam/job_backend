-- AlterTable
ALTER TABLE "Education" ADD COLUMN     "noOfActiveBacklogs" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "allowedBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedPassingYears" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
