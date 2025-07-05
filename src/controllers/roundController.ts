import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { sendRoundResultEmail } from "../utils/email";

export const uploadRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName, users, status } = req.body;

  try {
    const notFoundUsers: string[] = [];

    for (const username of users) {
      const user = await prisma.user.findUnique({
        where: { username: username }, 
      });

      if (!user) {
        notFoundUsers.push(username);
        continue;
      }

      const round = await prisma.round.findFirst({
        where: { jobId, roundName }
      });

      if (!round) {
        return res.status(404).json({ message: `Round "${roundName}" not found for this job.` });
      }

      await prisma.results.upsert({
        where: {
          userId_jobId_roundName: {
            userId: user.id,
            jobId,
            roundName,
          },
        },
        update: { status },
        create: {
          userId: user.id,
          jobId,
          roundId: round.id,
          roundName,
          status,
        },
      });

      // 🎉 Send email if qualified
      await sendRoundResultEmail(user.email, roundName, status);
    }

    return res.json({
      message: "Round results recorded and emails sent.",
      skippedUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return res.status(500).json({ message: "Error uploading round results", error });
  }
};


export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = req.params.userId; 

  try {
    const results = await prisma.results.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { timestamp: "desc" },
    });

    res.json({ rounds: results });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user rounds", error });
  }
};

export const getJobRoundSummary = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const rounds = await prisma.results.findMany({
      where: { jobId },
      include: {
        user: true,
      },
      orderBy: [
        { roundName: "asc" },
        { timestamp: "desc" }
      ],
    });

    res.json({ rounds });
  } catch (error) {
    console.error("❌ Error fetching round summary:", error);
    res.status(500).json({ message: "Failed to fetch job round summary", error });
  }
};
