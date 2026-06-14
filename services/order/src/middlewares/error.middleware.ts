import { Request, Response, NextFunction } from 'express';
import { AppError, errorResponse } from '@cloudcart/shared';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const errorHandler = (
  err: Error, _req: Request, res: Response, _next: NextFunction
): void => {
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(422).json(errorResponse(message));
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }
  console.error('[order] Unhandled error:', err);
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  res.status(500).json(errorResponse(message));
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route ${req.method} ${req.path} not found`));
};
