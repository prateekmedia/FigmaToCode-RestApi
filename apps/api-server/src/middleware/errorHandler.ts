import { Request, Response, NextFunction } from 'express';
import { Logger } from '../services/logger';
import { ErrorResponse } from '../types/api';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.message) {
    message = err.message;
    
    // Map common error types to appropriate status codes
    if (message.includes('token') || message.includes('permissions')) {
      statusCode = 401;
    } else if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('rate limit')) {
      statusCode = 429;
    } else if (message.includes('Invalid') || message.includes('validation')) {
      statusCode = 400;
    }
  }

  // Log the error
  Logger.error(`Request failed: ${req.method} ${req.path}`, {
    error: message,
    statusCode,
    stack: err.stack,
    body: req.body,
    headers: req.headers,
  });

  // Send error response
  const errorResponse: ErrorResponse = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Failed',
    message,
    statusCode,
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};