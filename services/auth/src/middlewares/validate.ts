import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// Factory function — creates a validation middleware for any Zod schema
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Pass to the global error handler — it knows how to format ZodErrors
      next(result.error);
      return;
    }
    // Replace req.body with the parsed/coerced data (trimmed strings, lowercase email, etc.)
    req.body = result.data;
    next();
  };
};
