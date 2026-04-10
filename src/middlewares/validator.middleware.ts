import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny, z } from 'zod';

const sendValidationError = (res: Response, error: z.ZodError): void => {
  res.status(400).json({
    message: 'Validation error',
    errors: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  });
};

export const validateBodySchema =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    req.body = result.data;
    next();
  };

export const validateParamsSchema =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    next();
  };

export const validateQuerySchema =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      sendValidationError(res, result.error);
      return;
    }
    next();
  };
