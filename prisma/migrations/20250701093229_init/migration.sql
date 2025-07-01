-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userName" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" VARCHAR(10),
    "otpExpiry" TIMESTAMP(3),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "phoneNumber" VARCHAR(20),
    "address" VARCHAR(255),
    "fatherName" VARCHAR(255),
    "motherName" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "profilePic" VARCHAR(500),
    "resume" VARCHAR(500),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "educationalLevel" VARCHAR(50) NOT NULL,
    "schoolOrCollege" VARCHAR(255) NOT NULL,
    "specialization" VARCHAR(255),
    "boardOrUniversity" VARCHAR(255),
    "percentage" DOUBLE PRECISION NOT NULL,
    "passedOutYear" INTEGER NOT NULL,
    "location" VARCHAR(255),

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "jobTitle" VARCHAR(255) NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "skillsRequired" JSONB NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "salary" VARCHAR(100),
    "experience" VARCHAR(100),
    "rounds" JSONB,
    "jobRole" VARCHAR(100),
    "jobType" VARCHAR(100),
    "postedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" VARCHAR(255) NOT NULL,
    "companyWebsite" VARCHAR(255),
    "companyLogo" VARCHAR(500),
    "companyEmail" VARCHAR(255),
    "companyPhone" VARCHAR(50),
    "lastDateToApply" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "resume" VARCHAR(500),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
