-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(100),
    "token" VARCHAR(255),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" VARCHAR(10),
    "otpExpiry" TIMESTAMP(3),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "collegeId" VARCHAR(100),
    "dateOfBirth" TIMESTAMP(3),
    "phoneNumber" VARCHAR(20),
    "address" VARCHAR(255),
    "fatherName" VARCHAR(255),
    "motherName" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "profilePic" VARCHAR(500),
    "resume" VARCHAR(500),
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "educationalLevel" VARCHAR(50) NOT NULL,
    "institution" VARCHAR(255) NOT NULL,
    "specialization" VARCHAR(255),
    "boardOrUniversity" VARCHAR(255),
    "percentage" DOUBLE PRECISION NOT NULL,
    "passedOutYear" INTEGER NOT NULL,
    "location" VARCHAR(255),
    "noOfActiveBacklogs" INTEGER DEFAULT 0,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "jobTitle" VARCHAR(255) NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "skillsRequired" JSONB NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "salary" VARCHAR(100),
    "experience" VARCHAR(100),
    "jobRole" VARCHAR(100),
    "jobType" VARCHAR(100),
    "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" VARCHAR(255) NOT NULL,
    "companyWebsite" VARCHAR(255),
    "companyLogo" VARCHAR(500),
    "companyEmail" VARCHAR(255),
    "companyPhone" VARCHAR(50),
    "lastDateToApply" TIMESTAMP(3),
    "allowedBranches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedPassingYears" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resume" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentRound" INTEGER,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "roundName" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Results" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "roundName" VARCHAR(100) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Qualified',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Results_userId_jobId_roundName_key" ON "Results"("userId", "jobId", "roundName");

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Results" ADD CONSTRAINT "Results_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
