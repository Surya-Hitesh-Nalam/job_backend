import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

import { sendJobPostedEmail } from '../utils/email'; 

export const createJob = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.id;
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
      companyName,
      companyWebsite,
      companyEmail,
      companyPhone,
      lastDateToApply,
      allowedBranches,
      allowedPassingYears,
    } = req.body;

    const file = req.file as Express.Multer.File | undefined;
    const logoUrl = file ? `/uploads/${file.filename}` : null;

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

const parsedRounds = typeof rounds === 'string'
  ? JSON.parse(rounds)
  : Array.isArray(rounds)
    ? rounds
    : [];


    const job = await prisma.job.create({
      data: {
        jobTitle,
        jobDescription,
        skillsRequired,
        location,
        salary,
        experience,
        jobRole,
        jobType,
        companyName,
        companyLogo: logoUrl,
        companyWebsite,
        companyEmail,
        createdById:adminId,
        companyPhone,
        allowedBranches: parsedAllowedBranches,
        allowedPassingYears: parsedAllowedPassingYears,
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

    const eligibleUsers = await prisma.user.findMany({
      where: {
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
      },
      include: {
        education: true,
      },
    });

    console.log(`Found ${eligibleUsers.length} eligible users.`);

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
    companyName,
    companyWebsite,
    companyEmail,
    companyPhone,
    lastDateToApply,
    allowedBranches,
    allowedPassingYears,
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

    const updatedData: any = {
      ...(jobTitle && { jobTitle }),
      ...(jobDescription && { jobDescription }),
      ...(parsedSkillsRequired.length && { skillsRequired: parsedSkillsRequired }),
      ...(location && { location }),
      ...(salary && { salary }),
      ...(experience && { experience }),
      ...(jobRole && { jobRole }),
      ...(jobType && { jobType }),
      ...(companyName && { companyName }),
      ...(companyWebsite && { companyWebsite }),
      ...(companyEmail && { companyEmail }),
      ...(companyPhone && { companyPhone }),
      ...(lastDateToApply && { lastDateToApply: new Date(lastDateToApply) }),
      ...(parsedAllowedBranches.length && { allowedBranches: parsedAllowedBranches }),
      ...(parsedAllowedPassingYears.length && {
        allowedPassingYears: parsedAllowedPassingYears,
      }),
    };

    const file = req.file as Express.Multer.File;
    if (file) {
      if (existingJob.companyLogo) {
        deleteFile(existingJob.companyLogo);
      }
      updatedData.companyLogo = `/uploads/${file.filename}`;
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

    const jobWithUpdatedRounds = await prisma.job.findUnique({
      where: { id: jobId },
      include: { rounds: { orderBy: { roundNumber: 'asc' } } },
    });

    return res.json({
      message: 'Job and rounds updated successfully',
      job: jobWithUpdatedRounds,
    });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ message: 'Failed to update job', error: err });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    await prisma.job.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job', error: err });
  }
}

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
