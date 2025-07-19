import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

import { sendRoundResultEmail } from '../utils/email';

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
        where: { jobId, roundName },
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
      await sendRoundResultEmail(user.email, roundName, status);
    }

    return res.json({
      message: 'Round results recorded and emails sent.',
      skippedUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(500).json({ message: 'Error uploading round results', error });
  }
};

export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const results = await prisma.results.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ rounds: results });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user rounds', error });
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
      orderBy: [{ roundName: 'asc' }, { timestamp: 'desc' }],
    });

    res.json({ rounds });
  } catch (error) {
    console.error('Error fetching round summary:', error);
    res.status(500).json({ message: 'Failed to fetch job round summary', error });
  }
};

export const getSpecificRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName } = req.params;

  try {
    const results = await prisma.results.findMany({
      where: {
        jobId,
        roundName,
      },
      include: {
        user: true,
        job: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for the specified round.' });
    }

    res.json({ roundResults: results });
  } catch (error) {
    console.error('Error fetching round-specific results:', error);
    res.status(500).json({ message: 'Failed to fetch specific round results', error });
  }
};

export const exportRoundResults = async (req: Request, res: Response) => {
  try {
    const { jobId, roundName, status, startDate, endDate } = req.query;

    const filters: any = {};

    if (jobId) filters.jobId = jobId;
    if (roundName) filters.roundName = roundName;
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.timestamp = {
        ...(startDate ? { gte: new Date(startDate as string) } : {}),
        ...(endDate ? { lte: new Date(endDate as string) } : {}),
      };
    }

    const results = await prisma.results.findMany({
      where: filters,
      include: {
        user: true,
        job: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Round Results');

    sheet.columns = [
      { header: 'Username', key: 'userName', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Job Title', key: 'jobTitle', width: 30 },
      { header: 'Round Name', key: 'roundName', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 25 },
    ];

    results.forEach(res => {
      const fullName = `${res.user?.firstName || ''} ${res.user?.lastName || ''}`.trim();
      sheet.addRow({
        userName: res.user?.username,
        fullName,
        email: res.user?.email,
        jobTitle: res.job?.jobTitle,
        roundName: res.roundName,
        status: res.status,
        timestamp: res.timestamp,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=round_results.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export failed:', error);
    res.status(500).json({ message: 'Failed to export round results', error });
  }
};
