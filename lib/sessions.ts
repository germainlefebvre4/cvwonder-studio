import crypto from 'crypto';
import { Session, CreateSessionRequest, UpdateSessionRequest } from './types';
import defaultCV from './defaultCV';
import prisma from './db';
import { validateTheme, initializeDefaultTheme } from './themes';
import { installCVWonderTheme } from './initialize-server';
import { logger } from './logger';

// Constants
const DEFAULT_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 7;

// Generate a random session ID
export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

// Calculate expiration date based on retention days
const calculateExpirationDate = (retentionDays: number = DEFAULT_RETENTION_DAYS): Date => {
  const maxDays = Math.min(retentionDays, MAX_RETENTION_DAYS);
  const date = new Date();
  date.setDate(date.getDate() + maxDays);
  return date;
};

// Create a new session
export const createSession = async (params: CreateSessionRequest = {}): Promise<Session> => {
  try {
    // Initialize default theme if it doesn't exist
    await initializeDefaultTheme();
    
    // Validate theme and install if necessary
    const theme = params.theme || 'default';
    
    try {
      // Optional installation step that might be needed for rendering
      await installCVWonderTheme(theme);
    } catch (themeError) {
      logger.error(`Failed to install theme ${theme}:`, themeError);
      throw new Error(`Failed to setup theme: ${theme}`);
    }
    
    // Validate theme exists in database
    const isThemeValid = await validateTheme(theme);
    if (!isThemeValid) {
      throw new Error(`Theme validation failed: ${theme}`);
    }
    
    const sessionId = generateSessionId();
    const now = new Date();
    const expiresAt = calculateExpirationDate(params.retentionDays);
    
    // Validate CV content
    const cvContent = params.initialContent || defaultCV;
    if (!cvContent || typeof cvContent !== 'string') {
      throw new Error('Invalid CV content');
    }
    
    // Create session in database
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        cvContent,
        selectedTheme: theme,
        createdAt: now,
        updatedAt: now,
        expiresAt
      },
      include: {
        theme: true
      }
    });
    
    // Return the session in the expected format
    return {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      cvContent: session.cvContent,
      selectedTheme: session.selectedTheme
    };
  } catch (error) {
    logger.error('Failed to create session:', error);
    throw error;
  }
};

// Get a session by ID with expiration check
export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return null;
    }
    
    // Check if session has expired
    if (new Date() > new Date(session.expiresAt)) {
      logger.info(`Session ${sessionId} - Session expired`);
      await deleteExpiredSession(sessionId);
      return null;
    }
    
    return {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      cvContent: session.cvContent,
      selectedTheme: session.selectedTheme
    };
  } catch (error) {
    logger.error(`Error retrieving session ${sessionId}:`, error);
    return null;
  }
};

// Delete an expired session
export const deleteExpiredSession = async (sessionId: string): Promise<void> => {
  try {
    // Delete session from database
    await prisma.session.delete({
      where: { id: sessionId }
    });
  } catch (error) {
    logger.error(`Error deleting expired session ${sessionId}:`, error);
  }
};

// Cleanup expired sessions
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const now = new Date();
    
    // Delete all expired sessions
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
};

// Update a session
export const updateSession = async (
  sessionId: string,
  updates: UpdateSessionRequest
): Promise<Session | null> => {
  try {
    const session = await getSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (updates.cvContent !== undefined) {
      updateData.cvContent = updates.cvContent;
    }
    
    if (updates.selectedTheme !== undefined) {
      // Validate theme exists
      const isThemeValid = await validateTheme(updates.selectedTheme);
      if (!isThemeValid) {
        throw new Error(`Theme validation failed: ${updates.selectedTheme}`);
      }
      updateData.selectedTheme = updates.selectedTheme;
    }
    
    if (updates.retentionDays !== undefined) {
      updateData.expiresAt = calculateExpirationDate(updates.retentionDays);
    }
    
    // Update session in database
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    });
    
    return {
      id: updatedSession.id,
      createdAt: updatedSession.createdAt,
      updatedAt: updatedSession.updatedAt,
      expiresAt: updatedSession.expiresAt,
      cvContent: updatedSession.cvContent,
      selectedTheme: updatedSession.selectedTheme
    };
  } catch (error) {
    logger.error(`Error updating session ${sessionId}:`, error);
    return null;
  }
};

// List recent sessions (for admin purposes)
export const listSessions = async (limit: number = 20): Promise<Session[]> => {
  try {
    const sessions = await prisma.session.findMany({
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return sessions.map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      cvContent: session.cvContent,
      selectedTheme: session.selectedTheme
    }));
  } catch (error) {
    logger.error('Error listing sessions:', error);
    return [];
  }
};