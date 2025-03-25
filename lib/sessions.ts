import { join } from 'path';
import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { Session, CreateSessionRequest, UpdateSessionRequest } from './types';
import { defaultCV } from './defaultCV';

// Directory to store all sessions
const SESSIONS_DIR = join(process.cwd(), 'sessions');

// Ensure sessions directory exists
export const ensureSessionsDir = async (): Promise<void> => {
  if (!existsSync(SESSIONS_DIR)) {
    await mkdir(SESSIONS_DIR, { recursive: true });
  }
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
  await ensureSessionsDir();
  
  const sessionId = generateSessionId();
  const sessionDir = getSessionDir(sessionId);
  
  // Create session directory
  await mkdir(sessionDir, { recursive: true });
  
  const now = new Date();
  const session: Session = {
    id: sessionId,
    createdAt: now,
    updatedAt: now,
    cvContent: params.initialContent || defaultCV,
    selectedTheme: params.theme || 'default',
  };
  
  // Write session metadata
  await writeFile(
    getSessionMetadataPath(sessionId),
    JSON.stringify(session, null, 2)
  );
  
  // Write initial CV content
  await writeFile(
    getSessionCVPath(sessionId),
    session.cvContent
  );
  
  return session;
};

// Get a session by ID
export const getSession = async (sessionId: string): Promise<Session | null> => {
  const metadataPath = getSessionMetadataPath(sessionId);
  
  if (!existsSync(metadataPath)) {
    return null;
  }
  
  try {
    const metadataJson = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataJson);
    
    // Convert string dates back to Date objects
    return {
      ...metadata,
      createdAt: new Date(metadata.createdAt),
      updatedAt: new Date(metadata.updatedAt),
    };
  } catch (error) {
    console.error(`Error retrieving session ${sessionId}:`, error);
    return null;
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