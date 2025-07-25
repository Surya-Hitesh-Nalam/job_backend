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

export const deleteRound = async(req:Request,res:Response)=>{
  try {
    await prisma.round.delete({
      where:{id:req.params.id}
    })
    res.json({"message":"Round deleted successfully"})
  } catch (error) {
    res.status(500).json({"message":"Failed to delete round",error})
  }
}

export const bulkDeleteUsersFromRound = async (req: Request, res: Response) => {
  try {
    const { jobId, roundName } = req.params;
    let { usernames } = req.body; 

    if (!jobId || !roundName || !usernames) {
      return res.status(400).json({ 
        message: 'Missing required parameters: jobId, roundName, and usernames are required' 
      });
    }

    if (typeof usernames === 'string') {
      usernames = [usernames];
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ 
        message: 'usernames must be a string or array of strings' 
      });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, jobTitle: true }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const round = await prisma.round.findFirst({
      where: { 
        jobId: jobId,
        roundName: roundName 
      }
    });

    if (!round) {
      return res.status(404).json({ 
        message: `Round "${roundName}" not found for this job` 
      });
    }

    const deletedUsers: any[] = [];
    const notFoundUsers: string[] = [];
    const emailErrors: string[] = [];

    for (const username of usernames) {
      try {
        const user = await prisma.user.findUnique({
          where: { username: username },
          select: { id: true, email: true, firstName: true, lastName: true, username: true }
        });

        if (!user) {
          notFoundUsers.push(username);
          continue;
        }

        const existingResult = await prisma.results.findUnique({
          where: {
            userId_jobId_roundName: {
              userId: user.id,
              jobId: jobId,
              roundName: roundName
            }
          }
        });

        if (!existingResult) {
          notFoundUsers.push(username);
          continue;
        }

        await prisma.results.delete({
          where: {
            userId_jobId_roundName: {
              userId: user.id,
              jobId: jobId,
              roundName: roundName
            }
          }
        });

        deletedUsers.push({
          username: user.username,
          email: user.email,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        });

        try {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
          
          await sendRoundResultEmail(
            user.email, 
            `${roundName} - Result Correction`, 
            'Correction - Previous result was sent by mistake. Please disregard the earlier notification.'
          );
        } catch (emailError) {
          console.error(`Email error for ${user.email}:`, emailError);
          emailErrors.push(user.email);
        }

      } catch (userError) {
        console.error(`Error processing username ${username}:`, userError);
        notFoundUsers.push(username);
      }
    }

    return res.json({
      message: 'Bulk deletion completed',
      deletedUsers: deletedUsers,
      summary: {
        totalRequested: usernames.length,
        successfullyDeleted: deletedUsers.length,
        notFound: notFoundUsers.length,
        emailErrors: emailErrors.length
      },
      notFoundUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return res.status(500).json({ 
      message: 'Failed to bulk delete users from round results',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
};
export const updateRoundResults = async (req: Request, res: Response) => {
  try {
    const { jobId, roundName } = req.params;
    let { usernames, status } = req.body;
    if (!jobId || !roundName || !usernames || !status) {
      return res.status(400).json({ 
        message: 'Missing required parameters: jobId, roundName, usernames, and status are required' 
      });
    }

    if (typeof usernames === 'string') {
      usernames = [usernames];
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ 
        message: 'usernames must be a string or array of strings' 
      });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, jobTitle: true }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const round = await prisma.round.findFirst({
      where: { 
        jobId: jobId,
        roundName: roundName 
      }
    });

    if (!round) {
      return res.status(404).json({ 
        message: `Round "${roundName}" not found for this job` 
      });
    }

    const updatedUsers: any[] = [];
    const createdUsers: any[] = [];
    const notFoundUsers: string[] = [];
    const emailErrors: string[] = [];

    for (const username of usernames) {
      try {
        const user = await prisma.user.findUnique({
          where: { username: username },
          select: { id: true, email: true, firstName: true, lastName: true, username: true }
        });

        if (!user) {
          notFoundUsers.push(username);
          continue;
        }

        const existingResult = await prisma.results.findUnique({
          where: {
            userId_jobId_roundName: {
              userId: user.id,
              jobId: jobId,
              roundName: roundName
            }
          }
        });

        const result = await prisma.results.upsert({
          where: {
            userId_jobId_roundName: {
              userId: user.id,
              jobId: jobId,
              roundName: roundName
            }
          },
          update: { 
            status: status,
            timestamp: new Date() 
          },
          create: {
            userId: user.id,
            jobId: jobId,
            roundId: round.id,
            roundName: roundName,
            status: status
          }
        });

        const userInfo = {
          username: user.username,
          email: user.email,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          status: status
        };

        if (existingResult) {
          updatedUsers.push(userInfo);
        } else {
          createdUsers.push(userInfo);
        }

        try {
          await sendRoundResultEmail(user.email, roundName, status);
        } catch (emailError) {
          console.error(`Email error for ${user.email}:`, emailError);
          emailErrors.push(user.email);
        }

      } catch (userError) {
        console.error(`Error processing username ${username}:`, userError);
        notFoundUsers.push(username);
      }
    }

    return res.json({
      message: 'Round results updated successfully',
      summary: {
        totalRequested: usernames.length,
        created: createdUsers.length,
        updated: updatedUsers.length,
        notFound: notFoundUsers.length,
        emailErrors: emailErrors.length
      },
      createdUsers: createdUsers.length > 0 ? createdUsers : undefined,
      updatedUsers: updatedUsers.length > 0 ? updatedUsers : undefined,
      notFoundUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined
    });

  } catch (error) {
    console.error('Error updating round results:', error);
    return res.status(500).json({ 
      message: 'Failed to update round results',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
};