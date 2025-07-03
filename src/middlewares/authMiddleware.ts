import dotenv from 'dotenv';
dotenv.config();

import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export const protect: RequestHandler = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      token = req.cookies?.auth_token;
    }
    
    if (!token) {
      res.status(401).json({ 
        message: "Access denied. No token provided.",
        requiresLogin: true 
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.status(401).json({ 
        message: "Token expired. Please login again.",
        requiresLogin: true,
        tokenExpired: true
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        message: "Invalid token. Please login again.",
        requiresLogin: true
      });
    } else {
      res.status(401).json({ 
        message: "Authentication failed",
        requiresLogin: true
      });
    }
    return;
  }
};