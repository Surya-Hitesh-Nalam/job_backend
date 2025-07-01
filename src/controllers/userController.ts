import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";
import { sendOtpEmail } from "../utils/email";
import { generateOTP } from "../utils/otp";

const prisma = new PrismaClient();

export const signup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { userName, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { userName }] },
  });
  if (existing)
    return res.status(400).json({ message: "Username or Email exists" });

  const hashed = await hashPassword(password);
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  const user = await prisma.user.create({
    data: { userName, email, password: hashed, otp, otpExpiry: expiry },
  });

  await sendOtpEmail(email, otp);
  return res
    .status(201)
    .json({ message: "OTP sent to email. Please verify your account." });
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email, otp } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  await prisma.user.update({
    where: { email },
    data: { isVerified: true, otp: null, otpExpiry: null },
  });

  return res.status(200).json({ message: "Email verified successfully" });
};

// 🛂 Login with JWT token and cookie
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { userName, password } = req.body;

  const user = await prisma.user.findFirst({ where: { userName: userName } });
  if (!user || !user.isVerified) 
    return res.status(403).json({ message: "Unverified or not found" });

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  // Generate token with expiration
const token = generateToken(user.id.toString());  
  // Set HTTP-only cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  // Return user data (without password) and token
  const { password: _, ...userWithoutPassword } = user;
  return res.json({ 
    user: userWithoutPassword, 
    token,
    message: "Login successful" 
  });
};

export const requestPasswordOtp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "Email not found" });

  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: { otp, otpExpiry: expiry },
  });

  await sendOtpEmail(email, otp);
  return res.json({ message: "OTP sent to email" });
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email, otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const hashed = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: { password: hashed, otp: null, otpExpiry: null },
  });

  return res.json({ message: "Password updated successfully" });
};

// 🚪 Logout with cookie clearing
export const logout = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  return res.status(200).json({ message: "Logged out successfully" });
};

// 🔧 Update user profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    const { password, otp, otpExpiry, ...safeData } = data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: safeData,
      select: {
        id: true,
        userName: true,
        email: true,
        isVerified: true,
        // Exclude password and OTP fields
      }
    });

    return res.json({ 
      user: updatedUser,
      message: "Profile updated successfully" 
    });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error });
  }
};

// 🔍 Get current user profile
export const getProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        userName: true,
        email: true,
        isVerified: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get profile", error });
  }
};