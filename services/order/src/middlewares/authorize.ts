import { Request, Response, NextFunction } from 'express';
import { UserRole, ForbiddenError } from '@cloudcart/shared';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
};
