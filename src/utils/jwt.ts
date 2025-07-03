import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined");
}

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId }, 
    JWT_SECRET, 
    { 
      expiresIn: '24h', 
      issuer: 'your-app-name',
      audience: 'your-app-users'
    }
  );
};