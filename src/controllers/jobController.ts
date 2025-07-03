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
        rounds,
        jobRole,
        jobType,
        companyName,
        companyWebsite,
        companyLogo,
        companyEmail,
        companyPhone,
        lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : null,
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
      where: { id:req.params.id },
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
  try {
    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ message: "Job updated", job: updated });
  } catch (err) {
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
