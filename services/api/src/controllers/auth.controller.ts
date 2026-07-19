import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, signJWT } from '../utils/helpers.js';
import { AuthenticationError, ConflictError } from '../utils/errors.js';

/**
 * Register a new user.
 */
export async function register(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: 'default', email } },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create tenant if not exists (MVP: single default tenant)
    await prisma.tenant.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Default Tenant',
        slug: 'default',
      },
    });

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        tenantId: 'default',
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'member',
      },
    });

    // Create default user settings
    await prisma.userSettings.create({
      data: { userId: user.id },
    });

    const token = signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login a user.
 */
export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: 'default', email } },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // For MVP, we store a simple password check
    // In production, use proper bcrypt comparison
    const isValid = await comparePassword(password, user.password || '');
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const token = signJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh JWT token.
 */
export async function refreshToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError();
    }

    const newToken = signJWT(user);
    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      throw new AuthenticationError();
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { userSettings: true },
    });

    if (!dbUser) {
      throw new AuthenticationError('User not found');
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl,
      preferences: dbUser.preferences,
      settings: dbUser.userSettings,
      createdAt: dbUser.createdAt,
    });
  } catch (error) {
    next(error);
  }
}
