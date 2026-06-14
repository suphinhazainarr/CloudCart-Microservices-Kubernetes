import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@cloudcart/shared';
import { env } from '../config/env';

// This middleware NEVER rejects a request.
// If a valid token exists → attach req.user
// If no token or invalid → attach req.sessionId from header
// The cart service uses whichever is available to find the right cart.

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
        req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      } catch {
        // Token exists but is invalid/expired — treat as guest
        req.user = undefined;
      }
    }

    // Guest identifier sent from frontend as a header
    // The frontend generates a UUID on first visit and stores it in localStorage
    if (!req.user) {
      req.sessionId = req.headers['x-session-id'] as string | undefined;
    }

    next();
  } catch {
    next(); // always continue — this middleware never blocks
  }
};
