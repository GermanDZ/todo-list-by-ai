import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';

/**
 * Middleware to log all API requests with structured data
 * Logs: method, path, status, responseTime, userId, timestamp
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const userId = (req as AuthRequest).userId || 'anonymous';

  // Log when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log request with structured data
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: userId,
    }));
  });

  next();
}

