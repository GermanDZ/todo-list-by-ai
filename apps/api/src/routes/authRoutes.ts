import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient.js';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  validateEmail,
  validatePassword,
} from '../services/authService.js';
import {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
} from '../services/refreshTokenService.js';
import { RegisterRequest, LoginRequest, AuthResponse, ErrorCode } from '../types/index.js';
import { createError } from '../utils/errors.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: RegisterRequest = req.body;

    // Validate input
    if (!email || !password) {
      return next(createError('Email and password are required', 400, ErrorCode.VALIDATION_ERROR));
    }

    if (!validateEmail(email)) {
      return next(createError('Invalid email format', 400, ErrorCode.VALIDATION_ERROR, { field: 'email' }));
    }

    if (!validatePassword(password)) {
      return next(createError('Password must be at least 8 characters', 400, ErrorCode.VALIDATION_ERROR, { field: 'password' }));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(createError('Email already registered', 409, ErrorCode.CONFLICT, { field: 'email' }));
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await createRefreshToken(user.id, refreshToken, expiresAt);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return user and access token
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return next(createError('Email and password are required', 400, ErrorCode.VALIDATION_ERROR));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(createError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED));
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return next(createError('Invalid email or password', 401, ErrorCode.UNAUTHORIZED));
    }

    // Delete any existing refresh tokens for this user (limit to one active session)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await createRefreshToken(user.id, refreshToken, expiresAt);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return user and access token
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(createError('Refresh token required', 401, ErrorCode.UNAUTHORIZED));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return next(createError('Invalid or expired refresh token', 401, ErrorCode.UNAUTHORIZED));
    }

    // Check if token exists in database
    const tokenRecord = await findRefreshToken(refreshToken);
    if (!tokenRecord) {
      return next(createError('Refresh token not found', 401, ErrorCode.UNAUTHORIZED));
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      await deleteRefreshToken(refreshToken);
      return next(createError('Refresh token expired', 401, ErrorCode.UNAUTHORIZED));
    }

    // Generate new tokens (rotation)
    const newAccessToken = generateAccessToken(
      decoded.userId,
      decoded.email
    );
    const newRefreshToken = generateRefreshToken(
      decoded.userId,
      decoded.email
    );

    // Delete old refresh token
    await deleteRefreshToken(refreshToken);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await createRefreshToken(decoded.userId, newRefreshToken, expiresAt);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return new access token
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Delete refresh token from database
      try {
        await deleteRefreshToken(refreshToken);
      } catch (error) {
        // Token might not exist, continue anyway
        console.error('Error deleting refresh token:', error);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

