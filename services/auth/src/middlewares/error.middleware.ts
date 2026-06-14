import { Request, Response, NextFunction } from 'express';
import { AppError, errorResponse } from '@cloudcart/shared';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(422).json(errorResponse(message));
    return;
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(409).json(errorResponse(`${field} already exists`));
    return;
  }

  // Unknown errors — don't leak internals in production
  console.error('Unhandled error:', err);
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  res.status(500).json(errorResponse(message));
};
