import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

import { sendRoundResultEmail } from '../utils/email';
export const uploadRoundResults = async (req: Request, res: Response) => {
  const { jobId, roundName, users: qualifiedUsernames } = req.body;

  try {
    // Validate required parameters
    if (!jobId || !roundName || !qualifiedUsernames) {
      return res.status(400).json({
        message: 'Missing required parameters: jobId, roundName, and users are required',
      });
    }

    if (!Array.isArray(qualifiedUsernames)) {
      return res.status(400).json({
        message: 'users must be an array of qualified usernames',
      });
    }

    // Validate job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, jobTitle: true },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Validate round exists
    const round = await prisma.round.findFirst({
      where: { jobId, roundName },
    });

    if (!round) {
      return res.status(404).json({
        message: `Round "${roundName}" not found for this job.`,
      });
    }

    // Get all users who applied for this job
    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Initialize trackers
    const addedUsers: any[] = [];
    const updatedUsers: any[] = [];
    const notFoundUsers: string[] = [];
    const emailErrors: string[] = [];

    const processedUserIds = new Set<string>();

    for (const app of applications) {
      const user = app.user;
      const isQualified = qualifiedUsernames.includes(user.username);
      const status = isQualified ? 'Qualified' : 'Disqualified';

      try {
        const existingResult = await prisma.results.findUnique({
          where: {
            userId_jobId_roundName: {
              userId: user.id,
              jobId: jobId,
              roundName: roundName,
            },
          },
        });

        const userInfo = {
          username: user.username,
          email: user.email,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          status,
        };

        let shouldSendEmail = false;

        if (existingResult) {
          // Update only if status changed
          if (existingResult.status !== status) {
            await prisma.results.update({
              where: {
                userId_jobId_roundName: {
                  userId: user.id,
                  jobId: jobId,
                  roundName: roundName,
                },
              },
              data: {
                status,
                timestamp: new Date(),
              },
            });
            updatedUsers.push(userInfo);
            shouldSendEmail = true;
          }
        } else {
          // Create new result
          await prisma.results.create({
            data: {
              userId: user.id,
              jobId: jobId,
              roundId: round.id,
              roundName: roundName,
              status,
            },
          });
          addedUsers.push(userInfo);
          shouldSendEmail = true;
        }

        // Send email only if needed
        if (shouldSendEmail) {
          try {
            await sendRoundResultEmail(user.email, roundName, status);
          } catch (emailError) {
            console.error(`Email error for ${user.email}:`, emailError);
            emailErrors.push(user.email);
          }
        }

        processedUserIds.add(user.id);
      } catch (err) {
        console.error(`Error processing user ${user.username}:`, err);
        if (user.username) {
  notFoundUsers.push(user.username);
}
      }
    }

    return res.json({
      message: 'Round results processed successfully',
      summary: {
        totalApplied: applications.length,
        qualifiedReceived: qualifiedUsernames.length,
        newlyAdded: addedUsers.length,
        updated: updatedUsers.length,
        notFound: notFoundUsers.length,
        emailErrors: emailErrors.length,
      },
      newlyAddedUsers: addedUsers.length > 0 ? addedUsers : undefined,
      updatedUsers: updatedUsers.length > 0 ? updatedUsers : undefined,
      notFoundUsers: notFoundUsers.length > 0 ? notFoundUsers : undefined,
      emailErrors: emailErrors.length > 0 ? emailErrors : undefined,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(500).json({
      message: 'Error uploading round results',
      error: process.env.NODE_ENV === 'development' ? error : 'Internal server error',
    });
  }
};

export const getUserRoundResults = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;

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
       let  usernames  = req.body; 

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
