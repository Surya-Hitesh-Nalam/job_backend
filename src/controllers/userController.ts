import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken } from "../utils/jwt";

const prisma = new PrismaClient();

// 📝 Signup with username (userName), email, and password
export const signup = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { userName, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name: userName }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name: userName, email, password: hashedPassword },
    });

    const token = generateToken(user.id);

    return res.status(201).json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error });
  }
};

// 🛂 Login using username and password
export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { userName, password } = req.body;

    const user = await prisma.user.findUnique({ where: { name: userName } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user.id);
    return res.json({ user, token });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error });
  }
};

// 🚪 Logout (JWT-based, stateless)
export const logout = async (_req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ message: "Logged out successfully" });
};

// 🔧 Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = (req as any).user.id;
    const data = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error });
  }
};
