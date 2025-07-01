import dotenv from 'dotenv';
dotenv.config();

import { RequestHandler } from "express";
import  jwt  from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export const protect: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};