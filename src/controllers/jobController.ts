import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const createJob = async (req: Request, res: Response) => {
  try {
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
      companyLogo,
      companyEmail,
      companyPhone,
      lastDateToApply,
    } = req.body;

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
        companyWebsite,
        companyLogo,
        companyEmail,
        companyPhone,
        lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : null,
        rounds: {
          create: Array.isArray(rounds) ? rounds.map((r: any) => ({
            roundNumber: r.roundNumber,
            roundName: r.roundName,
            description: r.description,
          })) : [],
        },
      },
      include: {
        rounds: true, 
      },
    });

    return res.status(201).json({ message: "Job created", job });
  } catch (err) {
    console.error("Create job error:", err);
    return res.status(500).json({ message: "Failed to create job", error: err });
  }
};


export const getAllJobs = async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        rounds: {
          orderBy: { roundNumber: "asc" }, // Optional: to return rounds in order
        },
      },
      orderBy: { postedDate: "desc" },
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs", error: err });
  }
};


export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        rounds: {
          orderBy: { roundNumber: "asc" }, // Optional: consistent ordering
        },
      },
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch job", error: err });
  }
};


export const updateJob = async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const dataToUpdate = req.body;

  try {
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });

    if (!existingJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    // ✅ Update core job fields if present
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(dataToUpdate.jobTitle && { jobTitle: dataToUpdate.jobTitle }),
        ...(dataToUpdate.jobDescription && { jobDescription: dataToUpdate.jobDescription }),
        ...(dataToUpdate.skillsRequired && { skillsRequired: dataToUpdate.skillsRequired }),
        ...(dataToUpdate.location && { location: dataToUpdate.location }),
        ...(dataToUpdate.salary && { salary: dataToUpdate.salary }),
        ...(dataToUpdate.experience && { experience: dataToUpdate.experience }),
        ...(dataToUpdate.jobRole && { jobRole: dataToUpdate.jobRole }),
        ...(dataToUpdate.jobType && { jobType: dataToUpdate.jobType }),
        ...(dataToUpdate.companyName && { companyName: dataToUpdate.companyName }),
        ...(dataToUpdate.companyWebsite && { companyWebsite: dataToUpdate.companyWebsite }),
        ...(dataToUpdate.companyLogo && { companyLogo: dataToUpdate.companyLogo }),
        ...(dataToUpdate.companyEmail && { companyEmail: dataToUpdate.companyEmail }),
        ...(dataToUpdate.companyPhone && { companyPhone: dataToUpdate.companyPhone }),
        ...(dataToUpdate.lastDateToApply && {
          lastDateToApply: new Date(dataToUpdate.lastDateToApply),
        }),
      },
    });

    // ✅ Update only provided rounds (match by roundNumber + jobId)
    if (Array.isArray(dataToUpdate.rounds)) {
      for (const round of dataToUpdate.rounds) {
        const { roundNumber, roundName, description } = round;

        const existingRound = await prisma.round.findFirst({
          where: {
            jobId,
            roundNumber,
          },
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
            data: {
              jobId,
              roundNumber,
              roundName,
              description,
            },
          });
        }
      }
    }

    const jobWithUpdatedRounds = await prisma.job.findUnique({
      where: { id: jobId },
      include: { rounds: {
        orderBy: { roundNumber: "asc"}
      } },
    });

    return res.json({
      message: "Job and rounds updated successfully",
      job: jobWithUpdatedRounds,
    });
  } catch (err) {
    console.error("Update job error:", err);
    res.status(500).json({ message: "Failed to update job", error: err });
  }
};


export const deleteJob = async (req: Request, res: Response) => {
  try {
    await prisma.job.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete job", error: err });
  }
};
