import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { sendJobApplicationEmail } from '../utils/email';

export const applyToJob = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const jobId = req.params.jobId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { education: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const alreadyApplied = await prisma.jobApplication.findFirst({
      where: { userId, jobId },
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You already applied for this job' });
    }

    const btech = user.education.find(edu => edu.educationalLevel === 'B.Tech');

    if (!btech) {
      return res.status(400).json({
        message: 'Eligibility check failed: No B.Tech information provided.',
      });
    }

    if (btech.noOfActiveBacklogs && btech.noOfActiveBacklogs > 0) {
      return res.status(400).json({
        message: 'Eligibility check failed: You have active backlogs.',
      });
    }

    const eligibleBranches: string[] = (job as any).eligibleBranches || [];
    if (eligibleBranches.length > 0 && !eligibleBranches.includes(btech.specialization || '')) {
      return res.status(400).json({
        message: `Not eligible: Your branch (${btech.specialization}) is not allowed.`,
      });
    }

    const eligibleYears: number[] = (job as any).eligibleYears || [];
    if (eligibleYears.length > 0 && !eligibleYears.includes(btech.passedOutYear)) {
      return res.status(400).json({
        message: `Not eligible: Your year of passing (${btech.passedOutYear}) is not allowed.`,
      });
    }

    const userCPT = user.isCPT; 
    const jobCPT = (job as any).cptEligibility;

    if (jobCPT === 'CPT' && !userCPT) {
      return res.status(400).json({
        message: 'Not eligible: This job is only for CPT candidates.',
      });
    }

    const application = await prisma.jobApplication.create({
      data: {
        user: { connect: { id: userId } },
        job: { connect: { id: jobId } },
        resume: user.resume || null,
        status: 'Pending',
        currentRound: 1,
      },
    });

    await sendJobApplicationEmail(
      user.email,
      user.username || 'User',
      job.jobTitle,
      job.companyName
    );

    return res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
    console.error('Application failed:', error);
    return res.status(500).json({ message: 'Failed to apply', error });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const apps = await prisma.jobApplication.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json({ applications: apps });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch applications', error });
  }
};

export const getApplicationsForJob = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return res.status(404).json({ message: 'Job not found' });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
          include:{education:true},
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json({ jobTitle: job.jobTitle, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications', error });
  }
};

