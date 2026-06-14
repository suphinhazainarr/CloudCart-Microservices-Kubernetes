import { Request, Response } from 'express';
import { errorResponse } from '@cloudcart/shared';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(errorResponse(`Route ${req.method} ${req.path} not found`));
};
