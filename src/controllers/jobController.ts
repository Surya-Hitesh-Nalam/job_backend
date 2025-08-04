import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

import { sendJobPostedEmail } from '../utils/email'; 

export const createJob = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any)?.user?.id;
    const {
      jobTitle,
      jobDescription,
      skillsRequired,
      location,
      salary,
      experience,
      rounds,
      jobRole,
      jobType,
      jobSector,
      companyName,
      companyWebsite,
      companyEmail,
      companyPhone,
      serviceAgreement,
      noOfVacancies,
      lastDateToApply,
      allowedBranches,
      allowedPassingYears,
      cptEligibility, 
    } = req.body;

    const file = req.file as Express.Multer.File | undefined;
    const logoUrl = file ? `/uploads/${file.filename}` : null;
    console.log('Rounds:', rounds);
    console.log('CPT Eligibility:', cptEligibility);

    const parsedSkillsRequired = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired
        ? skillsRequired.split(',').map((skill: string) => skill.trim())
        : [];

    const parsedAllowedBranches = Array.isArray(allowedBranches)
      ? allowedBranches
      : allowedBranches
        ? allowedBranches.split(',').map((branch: string) => branch.trim())
        : [];

    const parsedAllowedPassingYears = Array.isArray(allowedPassingYears)
      ? allowedPassingYears.map((year: string | number) => Number(year))
      : allowedPassingYears
        ? allowedPassingYears.split(',').map((year: string) => Number(year.trim()))
        : [];

    const parsedRounds =
      typeof rounds === 'string' ? JSON.parse(rounds) : Array.isArray(rounds) ? rounds : [];
    console.log('Parsed Rounds:', parsedRounds);

    const job = await prisma.job.create({
      data: {
        jobTitle,
        jobDescription,
        skillsRequired: parsedSkillsRequired,
        location,
        salary,
        experience,
        jobRole,
        jobType,
        jobSector,
        companyName,
        companyLogo: logoUrl,
        companyWebsite,
        companyEmail,
        companyPhone,
        serviceAgreement,
        noOfVacancies: noOfVacancies,
        createdById: adminId,
        allowedBranches: parsedAllowedBranches,
        allowedPassingYears: parsedAllowedPassingYears,
        cptEligibility, 
        lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : null,
        rounds: {
          create: parsedRounds.map((r: any) => ({
            roundNumber: Number(r.roundNumber),
            roundName: r.roundName,
            description: r.description,
          })),
        },
      },
      include: {
        rounds: true,
      },
    });


    const whereClause: any = {
      role: 'USER',
      education: {
        some: {
          specialization: {
            in: parsedAllowedBranches,
          },
          passedOutYear: {
            in: parsedAllowedPassingYears,
          },
        },
      },
    };

  
    if (cptEligibility === 'CPT') {
      whereClause.isCPT = true;
    } else if (cptEligibility === 'NON_CPT') {
      whereClause.isCPT = false;
    }
    // If cptEligibility === 'BOTH', no additional filter is needed

    const eligibleUsers = await prisma.user.findMany({
      where: whereClause,
      include: {
        education: true,
      },
    });

    console.log(`Found ${eligibleUsers.length} eligible users for CPT eligibility: ${cptEligibility}`);

    for (const user of eligibleUsers) {
      await sendJobPostedEmail(
        user.email,
        user.firstName || user.username || 'Student',
        jobTitle,
        companyName,
        jobDescription,
        lastDateToApply ? new Date(lastDateToApply).toDateString() : 'N/A'
      );
    }

    console.log(`Emails sent to ${eligibleUsers.length} eligible users.`);

    return res.status(201).json({
      message: 'Job created and notifications sent to eligible students.',
      job,
      eligibleUsersCount: eligibleUsers.length,
      cptEligibility,
    });
  } catch (err) {
    console.error('Create job error:', err);
    return res.status(500).json({ message: 'Failed to create job', error: err });
  }
};

export const getAllJobs = async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { postedDate: 'desc' },
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: err });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        applications:true,
      },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job', error: err });
  }
};

const deleteFile = (relativeFilePath: string) => {
  if (!relativeFilePath) return;

  const cleanPath = relativeFilePath.startsWith('/')
    ? relativeFilePath.substring(1)
    : relativeFilePath;

  const absolutePath = path.resolve(__dirname, '../../', cleanPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    console.log(`Deleted file: ${absolutePath}`);
  }
};

export const updateJob = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const {
    jobTitle,
    jobDescription,
    skillsRequired,
    location,
    salary,
    experience,
    jobRole,
    jobType,
    jobSector,
    companyName,
    companyWebsite,
    companyEmail,
    companyPhone,
    serviceAgreement,
    noOfVacancies,
    lastDateToApply,
    allowedBranches,
    allowedPassingYears,
    cptEligibility, // New field for CPT eligibility
    rounds,
  } = req.body;

  try {
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const parsedSkillsRequired = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired
        ? skillsRequired.split(',').map((skill: string) => skill.trim())
        : [];

    const parsedAllowedBranches = Array.isArray(allowedBranches)
      ? allowedBranches
      : allowedBranches
        ? allowedBranches.split(',').map((branch: string) => branch.trim())
        : [];

    const parsedAllowedPassingYears = Array.isArray(allowedPassingYears)
      ? allowedPassingYears.map((year: string | number) => Number(year))
      : allowedPassingYears
        ? allowedPassingYears.split(',').map((year: string) => Number(year.trim()))
        : [];

    const parsedRounds =
      typeof rounds === 'string' ? JSON.parse(rounds) : Array.isArray(rounds) ? rounds : [];

    console.log('Parsed Rounds:', parsedRounds);
    console.log('CPT Eligibility Update:', cptEligibility);

    const updatedData: any = {
      ...(jobTitle && { jobTitle }),
      ...(jobDescription && { jobDescription }),
      ...(parsedSkillsRequired.length && { skillsRequired: parsedSkillsRequired }),
      ...(location && { location }),
      ...(salary && { salary }),
      ...(experience && { experience }),
      ...(jobRole && { jobRole }),
      ...(jobType && { jobType }),
      ...(jobSector && { jobSector }), 
      ...(companyName && { companyName }),
      ...(companyWebsite && { companyWebsite }),
      ...(companyEmail && { companyEmail }),
      ...(companyPhone && { companyPhone }),
      ...(serviceAgreement && { serviceAgreement: serviceAgreement }),
      ...(noOfVacancies && { noOfVacancies }),
      ...(lastDateToApply && { lastDateToApply: new Date(lastDateToApply) }),
      ...(parsedAllowedBranches.length && { allowedBranches: parsedAllowedBranches }),
      ...(parsedAllowedPassingYears.length && {
        allowedPassingYears: parsedAllowedPassingYears,
      }),
      ...(cptEligibility && { cptEligibility }), // Add CPT eligibility update
    };

    const file = req.file as Express.Multer.File;
    if (file) {
      if (existingJob.companyLogo) {
        deleteFile(existingJob.companyLogo);
      }
      updatedData.companyLogo = `/uploads/${file.filename}`;
    }

    // Check if CPT eligibility has changed and if we need to notify users
    const cptEligibilityChanged = cptEligibility && cptEligibility !== existingJob.cptEligibility;
    let shouldNotifyUsers = false;
    let eligibleUsers: any[] = [];

    // If CPT eligibility changed and job eligibility expanded, notify new eligible users
    if (cptEligibilityChanged) {
      console.log(`CPT eligibility changed from ${existingJob.cptEligibility} to ${cptEligibility}`);
      
      // Only notify if eligibility is expanding (more users become eligible)
      if (
        (existingJob.cptEligibility === 'CPT' && cptEligibility === 'BOTH') ||
        (existingJob.cptEligibility === 'NON_CPT' && cptEligibility === 'BOTH') ||
        (existingJob.cptEligibility === 'CPT' && cptEligibility === 'NON_CPT') ||
        (existingJob.cptEligibility === 'NON_CPT' && cptEligibility === 'CPT')
      ) {
        shouldNotifyUsers = true;
        
        // Build where clause for newly eligible users
        const whereClause: any = {
          role: 'USER',
          education: {
            some: {
              specialization: {
                in: updatedData.allowedBranches || existingJob.allowedBranches,
              },
              passedOutYear: {
                in: updatedData.allowedPassingYears || existingJob.allowedPassingYears,
              },
            },
          },
        };

        // Add CPT filter for newly eligible users only
        if (cptEligibility === 'CPT') {
          whereClause.isCPT = true;
        } else if (cptEligibility === 'NON_CPT') {
          whereClause.isCPT = false;
        }
        // For 'BOTH', no additional CPT filter needed

        // Get users who weren't eligible before but are now eligible
        const previousWhereClause: any = {
          role: 'USER',
          education: {
            some: {
              specialization: {
                in: existingJob.allowedBranches,
              },
              passedOutYear: {
                in: existingJob.allowedPassingYears,
              },
            },
          },
        };

        // Previous CPT filter
        if (existingJob.cptEligibility === 'CPT') {
          previousWhereClause.isCPT = true;
        } else if (existingJob.cptEligibility === 'NON_CPT') {
          previousWhereClause.isCPT = false;
        }

        const currentEligibleUsers = await prisma.user.findMany({
          where: whereClause,
          select: { id: true, email: true, firstName: true, username: true },
        });

        const previousEligibleUsers = await prisma.user.findMany({
          where: previousWhereClause,
          select: { id: true },
        });

        const previousEligibleUserIds = new Set(previousEligibleUsers.map(user => user.id));
        eligibleUsers = currentEligibleUsers.filter(user => !previousEligibleUserIds.has(user.id));
      }
    }

    await prisma.job.update({
      where: { id: jobId },
      data: updatedData,
    });

    if (Array.isArray(parsedRounds)) {
      for (const round of parsedRounds) {
        const { roundNumber, roundName, description } = round;

        const existingRound = await prisma.round.findFirst({
          where: { jobId, roundNumber },
        });

        if (existingRound) {
          await prisma.round.update({
            where: { id: existingRound.id },
            data: {
              roundName: roundName ?? existingRound.roundName,
              description: description ?? existingRound.description,
            },
          });
        } else {
          await prisma.round.create({
            data: { jobId, roundNumber, roundName, description },
          });
        }
      }
    }

    // Send notifications to newly eligible users if CPT eligibility expanded
    if (shouldNotifyUsers && eligibleUsers.length > 0) {
      console.log(`Sending notifications to ${eligibleUsers.length} newly eligible users`);
      
      for (const user of eligibleUsers) {
        await sendJobPostedEmail(
          user.email,
          user.firstName || user.username || 'Student',
          updatedData.jobTitle || existingJob.jobTitle,
          updatedData.companyName || existingJob.companyName,
          updatedData.jobDescription || existingJob.jobDescription,
          updatedData.lastDateToApply 
            ? new Date(updatedData.lastDateToApply).toDateString() 
            : existingJob.lastDateToApply 
            ? new Date(existingJob.lastDateToApply).toDateString() 
            : 'N/A'
        );
      }
      
      console.log(`Notifications sent to ${eligibleUsers.length} newly eligible users`);
    }

    const jobWithUpdatedRounds = await prisma.job.findUnique({
      where: { id: jobId },
      include: { rounds: { orderBy: { roundNumber: 'asc' } } },
    });

    return res.json({
      message: 'Job and rounds updated successfully',
      job: jobWithUpdatedRounds,
      ...(shouldNotifyUsers && { 
        newlyEligibleUsers: eligibleUsers.length,
        cptEligibilityChanged: true 
      }),
    });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ message: 'Failed to update job', error: err });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.companyLogo) {
      deleteFile(job.companyLogo);
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ message: 'Failed to delete job', error: err });
  }
};

export const getJobsByAdmin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const adminId = req.params.adminId;   

    const jobs = await prisma.job.findMany({
      where: { createdById: adminId },
      orderBy: { postedDate: 'desc' },
      include: {
        rounds: true,  
      },
    });

    return res.status(200).json({
      message: 'Jobs fetched',
      jobs,
    });

  } catch (error) {
    console.error('Error fetching jobs by admin:', error);
    return res.status(500).json({ message: 'Failed to fetch jobs.', error });
  }
};


