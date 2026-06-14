import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../services/token.service';
import { UnauthorizedError } from '@cloudcart/shared';
import { JwtPayload } from '@cloudcart/shared';

// Extend the Express Request type to carry our user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    // Check Authorization header first (for API clients)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fall back to cookie (for browser clients)
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify and decode
    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error && error.message === 'ACCESS_TOKEN_EXPIRED') {
      next(new UnauthorizedError('Access token expired'));
      return;
    }
    next(new UnauthorizedError('Invalid access token'));
  }
};
