import { RequestHandler } from 'express';

import { Request, Response, NextFunction } from 'express';

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  console.log('user role', user, user?.role);

  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({
      message: 'Access denied. Admins only.',
    });
    return;
  }

  next();
};
