import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UnauthorizedError } from '@cloudcart/shared';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request { user?: JwtPayload; }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies?.accessToken) token = req.cookies.accessToken;
    if (!token) throw new UnauthorizedError('Authentication required');

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
