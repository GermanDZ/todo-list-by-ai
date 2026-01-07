import prisma from './prismaClient.js';

/**
 * Create a new refresh token in the database
 * @param userId - User ID
 * @param token - Refresh token string
 * @param expiresAt - Token expiration date
 * @returns Created refresh token record
 */
export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * Find a refresh token by token string
 * @param token - Refresh token string
 * @returns Refresh token record if found, null otherwise
 */
export async function findRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
}

/**
 * Delete a refresh token (used for logout and rotation)
 * @param token - Refresh token string to delete
 */
export async function deleteRefreshToken(token: string) {
  return prisma.refreshToken.delete({
    where: { token },
  });
}

/**
 * Delete all refresh tokens for a user (used for logout all sessions)
 * @param userId - User ID
 */
export async function deleteAllUserRefreshTokens(userId: string) {
  return prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Clean up expired refresh tokens
 * This can be called periodically to remove expired tokens from the database
 */
export async function cleanupExpiredTokens() {
  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

