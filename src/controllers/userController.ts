import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { sendOtpEmail } from '../utils/email';
import { generateOTP } from '../utils/otp';

const prisma = new PrismaClient();

import { Role } from '@prisma/client';

export const signup = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password, role } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return res.status(400).json({ message: 'Username or Email already exists' });

  const hashed = await hashPassword(password);
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const assignedRole = role === 'ADMIN' ? Role.ADMIN : Role.USER;

  await prisma.user.create({
    data: {
      username,
      email,
      password: hashed,
      otp,
      otpExpiry: expiry,
      role: assignedRole,
    },
  });

  await sendOtpEmail(email, otp);

  return res.status(201).json({
    message: 'OTP sent to email. Please verify your account.',
  });
};

export const verifyEmail = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  await prisma.user.update({
    where: { email },
    data: { isVerified: true, otp: null, otpExpiry: null },
  });

  return res.status(200).json({ message: 'Email verified successfully' });
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({ where: { username: username } });
  if (!user) return res.status(403).json({ message: 'User not found' });

  if (!user.isVerified) {
    const otp = generateOTP();
    await sendOtpEmail(user.email, otp);
    return res
      .status(403)
      .json({ message: 'Please verify your email first. OTP sent to your email.' });
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken(user.id.toString(), user.role);
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  const { password: _, ...userWithoutPassword } = user;
  return res.json({
    user: userWithoutPassword,
    token,
    message: 'Login successful',
  });
};

export const requestPasswordOtp = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry: expiry },
  });

  await sendOtpEmail(email, otp);
  return res.json({ message: 'OTP sent to email' });
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashed, otp: null, otpExpiry: null },
  });

  return res.json({ message: 'Password updated successfully' });
};

export const logout = async (_req: Request, res: Response): Promise<Response> => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({ message: 'Logged out successfully' });
};

import fs from 'fs';
import path from 'path';
const deleteFile = (relativeFilePath: string) => {
  if (!relativeFilePath) return;

  const cleanPath = relativeFilePath.startsWith('/')
    ? relativeFilePath.substring(1)
    : relativeFilePath;

  const absolutePath = path.resolve(__dirname, '../../', cleanPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
    console.log(`Deleted file: ${absolutePath}`);
  } else {
    console.log(`File not found: ${absolutePath}`);
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<Response> => {
  console.log("updateProfile controller hit");

  try {
    const userId = (req as any).user?.id as string;

    const {
      password,
      otp,
      otpExpiry,
      education: rawEducation,
      dateOfBirth,
      passedOutYear,
      noOfActiveBacklogs,
      percentage,
      ...rest
    } = req.body;

    const safeData: any = {
      ...rest,
    };

    // ✅ Parse required types from strings
    if (percentage) safeData.percentage = parseFloat(percentage);
    if (noOfActiveBacklogs) safeData.noOfActiveBacklogs = parseInt(noOfActiveBacklogs);
    if (passedOutYear) safeData.passedOutYear = parseInt(passedOutYear);
    if (dateOfBirth) safeData.dateOfBirth = new Date(dateOfBirth);

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    // ✅ Handle Profile Picture
    if (files?.profilePic?.[0]) {
      if (existingUser?.profilePic) deleteFile(existingUser.profilePic);
      safeData.profilePic = `/uploads/${files.profilePic[0].filename}`;
    }

    // ✅ Handle Resume Upload
    if (files?.resume?.[0]) {
      if (existingUser?.resume) deleteFile(existingUser.resume);
      safeData.resume = `/uploads/${files.resume[0].filename}`;
    }

    // ✅ Update user data
    await prisma.user.update({
      where: { id: userId },
      data: safeData,
    });

    // ✅ Handle Education (all strings, parse properly)
    if (rawEducation && Array.isArray(rawEducation)) {
      const parsedEducation = rawEducation.map((edu: any) => ({
        educationalLevel: edu.educationalLevel,
        institution: edu.institution,
        specialization: edu.specialization || null,
        boardOrUniversity: edu.boardOrUniversity || null,
        location: edu.location || null,
        percentage: parseFloat(edu.percentage),
        passedOutYear: parseInt(edu.passedOutYear),
        noOfActiveBacklogs: edu.noOfActiveBacklogs ? parseInt(edu.noOfActiveBacklogs) : 0,
        userId,
      }));

      // Replace old education
      await prisma.education.deleteMany({ where: { userId } });
      await prisma.education.createMany({ data: parsedEducation });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { education: true },
    });

    return res.json({
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update failed:", error);
    return res.status(500).json({ message: "Update failed", error });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        education: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cleanedUser = safeUser(user);

    return res.json({ user: cleanedUser });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Failed to get profile', error });
  }
};

const safeUser = (user: any) => {
  const { password, otp, otpExpiry, applications, roundResults, ...rest } = user;
  return rest;
};

export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Parse pagination query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Fetch total user count
    const totalUsers = await prisma.user.count();

    // Fetch paginated users
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      include: {
        education: true,
      },
    });

    const cleanedUsers = users.map(safeUser);

    return res.json({
      users: cleanedUsers,
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const [
      totalJobs,
      totalApplications,
      totalUsers,
      totalQualified,
      userRoles,
      btechSpecializations,
      jobSummaries,
      topJobs,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.jobApplication.count(),
      prisma.user.count(),
      prisma.results.count({ where: { status: 'Qualified' } }),

      // User roles breakdown (e.g., CANDIDATE, RECRUITER)
      prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),

      // Group by B.Tech specializations
      prisma.education.groupBy({
        by: ['specialization'],
        where: {
          educationalLevel: 'B.Tech',
          specialization: {
            not: null, // Avoid counting null specializations
          },
        },
        _count: {
          specialization: true,
        },
      }),

      // Job-wise summary
      prisma.job.findMany({
        select: {
          id: true,
          jobRole: true,
          applications: {
            select: { id: true },
          },
          rounds: {
            select: {
              roundNumber: true,
              results: {
                where: { status: 'Qualified' },
                select: { id: true },
              },
            },
          },
        },
      }),

      // Top jobs by application count
      prisma.job.findMany({
        orderBy: {
          applications: {
            _count: 'desc',
          },
        },
        take: 5,
        select: {
          id: true,
          jobRole: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      dashboard: {
        totalJobs,
        totalApplications,
        totalUsers,
        totalQualified,
        userRoles, // [{ role: 'CANDIDATE', _count: { _all: 50 } }, ...]
        btechSpecializations, // [{ specialization: 'CSE', _count: { specialization: 12 } }, ...]
        jobSummaries,
        topJobs,
      },
    });
  } catch (error) {
    console.error('Admin dashboard failed:', error);
    return res.status(500).json({ message: 'Failed to load admin dashboard', error });
  }
};