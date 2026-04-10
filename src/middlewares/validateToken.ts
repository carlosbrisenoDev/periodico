import { NextFunction, Request, Response } from 'express';
import { env } from '../config.js';
import { JwtPayload, verifyAuthToken } from '../libs/jwt.js';

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

export const validateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    req.user = verifyAuthToken(token);
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
