import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { QueryFailedError } from 'typeorm';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // TypeORM duplicate key
  if (err instanceof QueryFailedError) {
    const detail = (err as any).detail || '';
    if (detail.includes('already exists')) {
      res.status(409).json({ success: false, message: 'Resource already exists' });
      return;
    }
  }

  // Operational errors (AppError)
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired' });
    return;
  }

  // Unhandled errors
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found` });
};
