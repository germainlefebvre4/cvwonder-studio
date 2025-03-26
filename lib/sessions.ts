import { join } from 'path';
import { mkdir, writeFile, readFile, readdir, stat, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { Session, CreateSessionRequest, UpdateSessionRequest } from './types';
import defaultCV from './defaultCV';
import { installCVWonderTheme } from './initialize-server';

// Get base directory for sessions based on environment
const getBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  return process.cwd();
};

// Directory to store all sessions
const SESSIONS_DIR = join(getBaseDir(), 'sessions');
const THEMES_DIR = join(process.cwd(), 'themes'); // Always read themes from codebase
const DEFAULT_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 7;

// Validate theme existence
const validateTheme = async (theme: string = 'default'): Promise<boolean> => {
  const themePath = join(THEMES_DIR, theme);
  return existsSync(themePath) && existsSync(join(themePath, 'index.html'));
};

// Ensure sessions directory exists
export const ensureSessionsDir = async (): Promise<void> => {
  try {
    if (!existsSync(SESSIONS_DIR)) {
      await mkdir(SESSIONS_DIR, { recursive: true });
    }
    // Verify write permissions by attempting to create and remove a test file
    const testFile = join(SESSIONS_DIR, '.test');
    await writeFile(testFile, '');
    await readFile(testFile);
    const stats = await stat(testFile);
    if (!stats.isFile()) {
      throw new Error('Failed to create test file');
    }
    await unlink(testFile);
  } catch (error) {
    console.error('Sessions directory setup failed:', error);
    throw new Error('Failed to setup sessions directory: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Calculate expiration date based on retention days
const calculateExpirationDate = (retentionDays: number = DEFAULT_RETENTION_DAYS): Date => {
  const maxDays = Math.min(retentionDays, MAX_RETENTION_DAYS);
  const date = new Date();
  date.setDate(date.getDate() + maxDays);
  return date;
};

// Generate a random session ID
export const generateSessionId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Get the path to a specific session directory
export const getSessionDir = (sessionId: string): string => {
  return join(SESSIONS_DIR, sessionId);
};

// Get the path to a session's CV YAML file
export const getSessionCVPath = (sessionId: string): string => {
  return join(getSessionDir(sessionId), 'cv.yml');
};

// Get the path to a session's metadata file
export const getSessionMetadataPath = (sessionId: string): string => {
  return join(getSessionDir(sessionId), 'metadata.json');
};

// Create a new session
export const createSession = async (params: CreateSessionRequest = {}): Promise<Session> => {
  try {
    // Ensure sessions directory exists and is writable
    await ensureSessionsDir();
    
    // Validate theme and install if necessary
    const theme = params.theme || 'default';
    try {
      await installCVWonderTheme(theme);
    } catch (themeError) {
      console.error(`Failed to install theme ${theme}:`, themeError);
      throw new Error(`Failed to setup theme: ${theme}`);
    }
    
    const isThemeValid = await validateTheme(theme);
    if (!isThemeValid) {
      throw new Error(`Theme validation failed: ${theme}`);
    }
    
    const sessionId = generateSessionId();
    const sessionDir = getSessionDir(sessionId);
    
    // Create session directory
    await mkdir(sessionDir, { recursive: true });
    
    const now = new Date();
    const session: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      expiresAt: calculateExpirationDate(params.retentionDays),
      cvContent: params.initialContent || defaultCV,
      selectedTheme: theme,
    };
    
    // Validate CV content
    if (!session.cvContent || typeof session.cvContent !== 'string') {
      throw new Error('Invalid CV content');
    }
    
    // Write session metadata
    const metadataPath = getSessionMetadataPath(sessionId);
    await writeFile(
      metadataPath,
      JSON.stringify(session, null, 2)
    );
    
    // Verify metadata was written correctly
    const writtenMetadata = await readFile(metadataPath, 'utf-8');
    JSON.parse(writtenMetadata); // Validate JSON
    
    // Write initial CV content
    const cvPath = getSessionCVPath(sessionId);
    await writeFile(cvPath, session.cvContent);
    
    // Verify CV content was written correctly
    const writtenContent = await readFile(cvPath, 'utf-8');
    if (writtenContent !== session.cvContent) {
      throw new Error('CV content verification failed');
    }
    
    // Schedule cleanup for this session
    setTimeout(async () => {
      await deleteExpiredSession(sessionId);
    }, session.expiresAt.getTime() - now.getTime());
    
    return session;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
};

// Get a session by ID with expiration check
export const getSession = async (sessionId: string): Promise<Session | null> => {
  const metadataPath = getSessionMetadataPath(sessionId);
  
  if (!existsSync(metadataPath)) {
    return null;
  }
  
  try {
    const metadataJson = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataJson);
    
    const session = {
      ...metadata,
      createdAt: new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
      expiresAt: new Date(metadata.expiresAt),
    };

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await deleteExpiredSession(sessionId);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error(`Error retrieving session ${sessionId}:`, error);
    return null;
  }
};

// Delete an expired session
export const deleteExpiredSession = async (sessionId: string): Promise<void> => {
  try {
    const sessionDir = getSessionDir(sessionId);
    if (existsSync(sessionDir)) {
      await rm(sessionDir, { recursive: true });
    }
  } catch (error) {
    console.error(`Error deleting expired session ${sessionId}:`, error);
  }
};

// Cleanup expired sessions
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const sessions = await listSessions(undefined); // Get all sessions
    const now = new Date();
    
    for (const session of sessions) {
      if (now > session.expiresAt) {
        await deleteExpiredSession(session.id);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};

// Update a session
export const updateSession = async (
  sessionId: string,
  updates: UpdateSessionRequest
): Promise<Session | null> => {
  const session = await getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  const updatedSession: Session = {
    ...session,
    updatedAt: new Date(),
    ...(updates.cvContent !== undefined && { cvContent: updates.cvContent }),
    ...(updates.selectedTheme !== undefined && { selectedTheme: updates.selectedTheme }),
    ...(updates.retentionDays !== undefined && { 
      expiresAt: calculateExpirationDate(updates.retentionDays) 
    }),
  };
  
  // Update metadata
  await writeFile(
    getSessionMetadataPath(sessionId),
    JSON.stringify(updatedSession, null, 2)
  );
  
  // Update CV content if provided
  if (updates.cvContent !== undefined) {
    await writeFile(
      getSessionCVPath(sessionId),
      updates.cvContent
    );
  }
  
  return updatedSession;
};

// List recent sessions (for admin purposes)
export const listSessions = async (limit: number = 20): Promise<Session[]> => {
  await ensureSessionsDir();
  
  const sessionDirs = await readdir(SESSIONS_DIR);
  const sessions: Session[] = [];
  
  for (const sessionId of sessionDirs.slice(0, limit)) {
    const session = await getSession(sessionId);
    if (session) {
      sessions.push(session);
    }
  }
  
  // Sort by updatedAt, newest first
  return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};