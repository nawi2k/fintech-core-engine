import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError || err?.message
      ? err.message
      : 'Error interno del servidor.';

  if (statusCode >= 500) {
    console.error('🔥 [FINTECH ERROR]:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    error: message,
  });
}