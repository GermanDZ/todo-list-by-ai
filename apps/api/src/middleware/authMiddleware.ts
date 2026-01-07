import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';
import { AuthRequest } from '../types/index.js';

/**
 * Middleware to authenticate requests using JWT access token
 * Extracts token from Authorization header and validates it
 * Attaches userId and user info to request object
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    (req as AuthRequest).userId = decoded.userId;
    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
    };
    return next();
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ error: error.message });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

