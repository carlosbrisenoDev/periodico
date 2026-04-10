import { NextFunction, Response } from 'express';
import { JwtPayload } from '../libs/jwt.js';
import { AuthenticatedRequest } from './validateToken.js';

export const requireRole =
  (...roles: JwtPayload['role'][]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    next();
  };
