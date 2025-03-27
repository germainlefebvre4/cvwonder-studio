import { join } from 'path';
import { mkdir, writeFile, readFile, readdir, stat, unlink, rm } from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { Session, CreateSessionRequest, UpdateSessionRequest } from './types';
import defaultCV from './defaultCV';
import { installCVWonderTheme } from './initialize-server';
import { put, list, del, head } from "@vercel/blob";

// Get base directory for sessions based on environment
const getBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  return '/tmp';
  return process.cwd();
};
export { getBaseDir };

// Directory to store all sessions
const SESSIONS_DIR = join(getBaseDir(), 'sessions');
const THEMES_DIR = join(process.cwd(), 'themes'); // Always read themes from codebase
const DEFAULT_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 7;

// Validate theme existence
const validateTheme = async (theme: string = 'default'): Promise<boolean> => {
  const themePath = join(THEMES_DIR, theme);
  console.log(`Validating theme path: ${themePath}`);
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

// Get the environment name for Blob storage
export const getEnvironmentName = (): string => {
  // For Vercel deployments, use the VERCEL_ENV
  if (process.env.VERCEL_ENV) {
    console.log(`Using Vercel environment: ${process.env.VERCEL_ENV}`);
    return process.env.VERCEL_ENV;
  }
  // For local development
  console.log('Using local environment for blob storage');
  return 'local';
};

// Get the Blob URL for a session's combined data file
export const getSessionDataBlobUrl = (sessionId: string): string => {
  const envName = getEnvironmentName();
  const blobUrl = `${envName}/sessions/${sessionId}/data.json`;
  console.log(`Generated data blob URL: ${blobUrl}`);
  return blobUrl;
};

// Legacy functions maintained for backward compatibility
export const getSessionCVBlobUrl = (sessionId: string): string => {
  const envName = getEnvironmentName();
  const blobUrl = `${envName}/sessions/${sessionId}/cv.yml`;
  console.log(`Generated legacy CV blob URL: ${blobUrl}`);
  return blobUrl;
};

export const getSessionMetadataBlobUrl = (sessionId: string): string => {
  const envName = getEnvironmentName();
  return `${envName}/sessions/${sessionId}/metadata.json`;
};

// Get the path to a session's metadata file
export const getSessionMetadataPath = (sessionId: string): string => {
  return join(getSessionDir(sessionId), 'metadata.json');
};

// Create a new session
export const createSession = async (params: CreateSessionRequest = {}): Promise<Session> => {
  try {
    // Ensure sessions directory exists and is writable for temporary files
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
    
    // Create session directory for temporary files
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
    
    // Write CV content to a local file for rendering (temporarily)
    const cvPath = getSessionCVPath(sessionId);
    await writeFile(cvPath, session.cvContent);
    
    // Write combined data to Vercel Blob
    try {
      const combinedData = {
        metadata: {
          id: sessionId,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          selectedTheme: theme,
          blobStoragePath: getEnvironmentName() + '/sessions/' + sessionId,
          storedAt: new Date().toISOString()
        },
        cvContent: session.cvContent
      };
      
      // Store blob data with public access
      const { url } = await put(getSessionDataBlobUrl(sessionId), JSON.stringify(combinedData, null, 2), { access: 'public' });
      console.log(`Combined session data written to Blob at: ${url}`);
      
      // Also store the URL in the filesystem metadata for backward compatibility
      // and to maintain a reference to the blob URL with its generated suffix
      const metadataPath = getSessionMetadataPath(sessionId);
      await writeFile(
        metadataPath,
        JSON.stringify({...session, blobUrl: url}, null, 2)
      );
    } catch (blobError) {
      console.error('Failed to store session data in Blob storage:', blobError);
      
      // Fall back to writing metadata to filesystem only
      const metadataPath = getSessionMetadataPath(sessionId);
      await writeFile(
        metadataPath,
        JSON.stringify(session, null, 2)
      );
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
  try {
    // First check if we have local metadata with a blobUrl
    try {
      const metadataPath = getSessionMetadataPath(sessionId);
      if (existsSync(metadataPath)) {
        console.log(`Found local metadata for session ${sessionId}, checking for blob URL...`);
        const metadataJson = await readFile(metadataPath, 'utf-8');
        const metadata = JSON.parse(metadataJson);
        
        // If the metadata contains a direct blobUrl, use it
        if (metadata.blobUrl) {
          console.log(`Found blob URL in metadata: ${metadata.blobUrl}`);
          try {
            const response = await fetch(metadata.blobUrl);
            if (response.ok) {
              const combinedData = await response.json();
              
              // Create a session object from the combined data
              const session: Session = {
                id: combinedData.metadata.id,
                createdAt: new Date(combinedData.metadata.createdAt),
                updatedAt: new Date(combinedData.metadata.updatedAt),
                expiresAt: new Date(combinedData.metadata.expiresAt),
                selectedTheme: combinedData.metadata.selectedTheme,
                cvContent: combinedData.cvContent
              };
              
              // Check if session has expired
              if (new Date() > session.expiresAt) {
                await deleteExpiredSession(sessionId);
                return null;
              }
              
              console.log(`Successfully loaded session data from stored blob URL: ${metadata.blobUrl}`);
              return session;
            } else {
              console.error(`Error fetching blob content: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError) {
            console.error(`Error fetching from blob URL: ${fetchError}`);
          }
        }
      }
    } catch (metadataError) {
      console.error(`Error reading local metadata file: ${metadataError}`);
    }
    
    // Try to get session data from Vercel Blob first
    try {
      // Check if the combined data blob exists
      const blobUrl = getSessionDataBlobUrl(sessionId);
      
      try {
        const blobInfo = await head(blobUrl);
        
        if (blobInfo) {
          // Blob exists, download it
          const response = await fetch(blobInfo.url);
          if (response.ok) {
            const combinedData = await response.json();
            
            // Create a session object from the combined data
            const session: Session = {
              id: combinedData.metadata.id,
              createdAt: new Date(combinedData.metadata.createdAt),
              updatedAt: new Date(combinedData.metadata.updatedAt),
              expiresAt: new Date(combinedData.metadata.expiresAt),
              selectedTheme: combinedData.metadata.selectedTheme,
              cvContent: combinedData.cvContent
            };
            
            // Check if session has expired
            if (new Date() > session.expiresAt) {
              await deleteExpiredSession(sessionId);
              return null;
            }
            
            console.log(`Successfully loaded session data from Blob storage: ${blobUrl}`);
            return session;
          } else {
            console.error(`Error fetching blob content: ${response.status} ${response.statusText}`);
          }
        }
      } catch (blobError: unknown) {
        // Only log if it's not a "not found" error or in development mode
        if (process.env.NODE_ENV === 'development' || 
            !(typeof blobError === 'object' && 
              blobError !== null && 
              'toString' in blobError && 
              blobError.toString().includes('BlobNotFoundError'))) {
          console.error(`Error fetching session data from Blob for session ${sessionId}:`, blobError);
        } else {
          console.log(`Blob not found for session ${sessionId}, checking legacy format...`);
        }
      }
    } catch (outerBlobError) {
      // This catch is just a safety net for any unexpected errors
      console.error(`Unexpected error during Blob access for session ${sessionId}:`, outerBlobError);
    }
    
    // Fallback to legacy format (separate files)
    try {
      // Try to get metadata from Vercel Blob
      const metadataBlobUrl = getSessionMetadataBlobUrl(sessionId);
      
      try {
        const metadataBlobInfo = await head(metadataBlobUrl);
        
        if (metadataBlobInfo) {
          const metadataResponse = await fetch(metadataBlobInfo.url);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            
            const session: Session = {
              ...metadata,
              createdAt: new Date(metadata.createdAt),
              updatedAt: new Date(metadata.updatedAt),
              expiresAt: new Date(metadata.expiresAt),
              cvContent: '' // Will populate next
            };
            
            // Check if session has expired
            if (new Date() > session.expiresAt) {
              await deleteExpiredSession(sessionId);
              return null;
            }
            
            // Try to get CV content
            try {
              const cvBlobUrl = getSessionCVBlobUrl(session.id);
              const cvBlobInfo = await head(cvBlobUrl);
              
              if (cvBlobInfo) {
                const cvResponse = await fetch(cvBlobInfo.url);
                if (cvResponse.ok) {
                  session.cvContent = await cvResponse.text();
                  
                  // Since we found legacy format data, migrate it to the new combined format
                  try {
                    await migrateSessionToSingleFile(session);
                  } catch (migrationError) {
                    console.error(`Error migrating session ${session.id} to single file:`, migrationError);
                  }
                }
              }
            } catch (cvError: unknown) {
              console.error(`Error fetching CV content for session ${session.id}:`, cvError);
            }
            
            // Return session even if we couldn't get CV content
            return session;
          }
        }
      } catch (metadataError: unknown) {
        // Only log detailed errors in development mode or if not "not found" error
        if (process.env.NODE_ENV === 'development' || 
            !(typeof metadataError === 'object' && 
              metadataError !== null && 
              'toString' in metadataError && 
              metadataError.toString().includes('BlobNotFoundError'))) {
          console.error(`Error fetching legacy session data from Blob for session ${sessionId}:`, metadataError);
        } else {
          console.log(`Legacy metadata blob not found for session ${sessionId}, checking filesystem...`);
        }
      }
    } catch (legacyError) {
      // This catch is just a safety net for any unexpected errors
      console.error(`Unexpected error during legacy Blob access for session ${sessionId}:`, legacyError);
    }
    
    // Last resort: try to get from filesystem (for backward compatibility)
    const metadataPath = getSessionMetadataPath(sessionId);
    if (!existsSync(metadataPath)) {
      console.log(`No session found for ID ${sessionId} in any storage location`);
      return null;
    }
    
    console.log(`Loading session ${sessionId} from filesystem...`);
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
    
    // Get CV content from local file
    try {
      const cvPath = getSessionCVPath(sessionId);
      if (existsSync(cvPath)) {
        session.cvContent = await readFile(cvPath, 'utf-8');
        
        // Migrate to blob storage for future requests
        try {
          await migrateSessionToSingleFile(session);
          console.log(`Migrated session ${sessionId} from filesystem to Blob storage`);
        } catch (migrationError) {
          console.error(`Error migrating session ${sessionId} to Blob storage:`, migrationError);
        }
      }
    } catch (fileError) {
      console.error(`Error reading local CV file for session ${sessionId}:`, fileError);
    }
    
    return session;
  } catch (error) {
    console.error(`Error retrieving session ${sessionId}:`, error);
    return null;
  }
};

// Helper function to migrate a session to the new single file format
const migrateSessionToSingleFile = async (session: Session): Promise<void> => {
  try {
    const combinedData = {
      metadata: {
        id: session.id,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        selectedTheme: session.selectedTheme,
        blobStoragePath: getEnvironmentName() + '/sessions/' + session.id,
        storedAt: new Date().toISOString(),
        migratedAt: new Date().toISOString()
      },
      cvContent: session.cvContent
    };
    
    await put(getSessionDataBlobUrl(session.id), JSON.stringify(combinedData, null, 2), { access: 'public' });
    console.log(`Migrated session ${session.id} to single file format`);
  } catch (error) {
    console.error(`Failed to migrate session ${session.id} to single file:`, error);
    throw error;
  }
};

// Delete an expired session
export const deleteExpiredSession = async (sessionId: string): Promise<void> => {
  try {
    // Delete from Vercel Blob
    try {
      // Delete combined data file
      await del(getSessionDataBlobUrl(sessionId));
      
      // Also try to delete legacy files for complete cleanup
      try {
        await del(getSessionCVBlobUrl(sessionId));
        await del(getSessionMetadataBlobUrl(sessionId));
      } catch (legacyError) {
        // Ignore errors from legacy files that might not exist
      }
      
      console.log(`Successfully deleted session ${sessionId} from Blob storage`);
    } catch (blobError) {
      console.error(`Error deleting session data from Blob for session ${sessionId}:`, blobError);
    }
    
    // Delete from filesystem (temporary files only)
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
  
  // Update CV content in local file for rendering if needed
  if (updates.cvContent !== undefined) {
    const cvPath = getSessionCVPath(sessionId);
    await writeFile(cvPath, updates.cvContent);
  }
  
  // Update combined data in Vercel Blob
  try {
    const combinedData = {
      metadata: {
        id: sessionId,
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString(),
        expiresAt: updatedSession.expiresAt.toISOString(),
        selectedTheme: updatedSession.selectedTheme,
        blobStoragePath: getEnvironmentName() + '/sessions/' + sessionId,
        lastModified: new Date().toISOString()
      },
      cvContent: updatedSession.cvContent
    };
    
    const { url } = await put(getSessionDataBlobUrl(sessionId), JSON.stringify(combinedData, null, 2), { access: 'public' });
    console.log(`Updated combined session data in Blob storage for session ${sessionId} at: ${url}`);
    
    // Store the URL in local metadata file for easier retrieval
    try {
      const metadataPath = getSessionMetadataPath(sessionId);
      await writeFile(
        metadataPath,
        JSON.stringify({...updatedSession, blobUrl: url}, null, 2)
      );
    } catch (metadataError) {
      console.error(`Error updating local metadata file: ${metadataError}`);
    }
  } catch (blobError) {
    console.error(`Error updating combined session data in Blob storage for session ${sessionId}:`, blobError);
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

// List sessions from Blob storage
export const listBlobSessions = async (envName?: string): Promise<Session[]> => {
  const env = envName || getEnvironmentName();
  const sessions: Session[] = [];
  
  try {
    // List all blobs under the environment's sessions directory
    const { blobs } = await list({ prefix: `${env}/sessions/` });
    
    // Filter for data.json files (new combined format)
    const dataBlobs = blobs.filter(blob => blob.pathname.endsWith('/data.json'));
    
    // Fetch each data file
    for (const blob of dataBlobs) {
      try {
        const response = await fetch(blob.url);
        if (response.ok) {
          const combinedData = await response.json();
          
          // Convert date strings to Date objects
          const session: Session = {
            id: combinedData.metadata.id,
            createdAt: new Date(combinedData.metadata.createdAt),
            updatedAt: new Date(combinedData.metadata.updatedAt),
            expiresAt: new Date(combinedData.metadata.expiresAt),
            selectedTheme: combinedData.metadata.selectedTheme,
            cvContent: combinedData.cvContent
          };
          
          sessions.push(session);
        }
      } catch (error) {
        console.error(`Error fetching session data from ${blob.url}:`, error);
      }
    }
    
    // If no combined data files were found, fall back to the legacy format
    if (sessions.length === 0) {
      // Filter for metadata files (legacy format)
      const metadataBlobs = blobs.filter(blob => blob.pathname.endsWith('/metadata.json'));
      
      // Fetch each metadata file
      for (const blob of metadataBlobs) {
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const metadata = await response.json();
            
            // Convert date strings to Date objects
            const session = {
              ...metadata,
              createdAt: new Date(metadata.createdAt),
              updatedAt: new Date(metadata.updatedAt),
              expiresAt: new Date(metadata.expiresAt),
              cvContent: '' // We'll try to populate this next
            };
            
            // Try to get CV content
            try {
              const cvBlobUrl = getSessionCVBlobUrl(session.id);
              const cvBlobInfo = await head(cvBlobUrl);
              
              if (cvBlobInfo) {
                const cvResponse = await fetch(cvBlobInfo.url);
                if (cvResponse.ok) {
                  session.cvContent = await cvResponse.text();
                  
                  // Since we found legacy format data, migrate it to the new combined format
                  try {
                    await migrateSessionToSingleFile(session);
                  } catch (migrationError) {
                    console.error(`Error migrating session ${session.id} to single file:`, migrationError);
                  }
                }
              }
            } catch (cvError: unknown) {
              console.error(`Error fetching CV content for session ${session.id}:`, cvError);
            }
            
            sessions.push(session);
          }
        } catch (error) {
          console.error(`Error fetching session metadata from ${blob.url}:`, error);
        }
      }
    }
    
    // Sort by updatedAt, newest first
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error('Error listing sessions from Blob storage:', error);
    return [];
  }
};

// Cleanup expired sessions from Blob storage
export const cleanupExpiredBlobSessions = async (envName?: string): Promise<void> => {
  try {
    const sessions = await listBlobSessions(envName);
    const now = new Date();
    
    for (const session of sessions) {
      if (now > session.expiresAt) {
        console.log(`Deleting expired session ${session.id} from Blob storage`);
        await deleteExpiredSession(session.id);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions from Blob storage:', error);
  }
};