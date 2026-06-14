import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@cloudcart/shared';
import { env } from '../config/env';

// Extend Request globally for the gateway
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Optional auth — attaches user if token is valid, never blocks
// The downstream service decides whether the route requires auth
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
        req.user = payload;

        // Forward user info as headers to downstream services
        // Services trust these headers — they come from the gateway
        req.headers['x-user-id']   = payload.userId;
        req.headers['x-user-email']= payload.email;
        req.headers['x-user-role'] = payload.role;
      } catch {
        // Expired or invalid token — continue as unauthenticated
        // The downstream service will reject if auth is required
      }
    }
  } catch {
    // Never block on auth middleware failures
  }

  next();
};
