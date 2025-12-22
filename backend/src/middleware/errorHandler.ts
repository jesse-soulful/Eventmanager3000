import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handler middleware
 * Prevents information disclosure in production
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error details server-side (but don't expose to client)
  console.error('Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = error.statusCode || error.status || 500;

  // In production, don't expose error details
  if (process.env.NODE_ENV === 'production') {
    // Generic error messages for production
    if (statusCode === 500) {
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
    
    // For known errors, return generic message
    return res.status(statusCode).json({
      error: error.message || 'An error occurred',
    });
  }

  // In development, include more details
  res.status(statusCode).json({
    error: error.message || 'An error occurred',
    ...(error.stack && { stack: error.stack }),
    ...(error.details && { details: error.details }),
  });
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}




