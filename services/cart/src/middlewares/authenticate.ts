import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UnauthorizedError } from '@cloudcart/shared';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?:      JwtPayload;
      sessionId?: string;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) throw new UnauthorizedError('Authentication required');

    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
