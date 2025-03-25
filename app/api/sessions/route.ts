import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionDir } from '@/lib/sessions';
import { CreateSessionRequest } from '@/lib/types';
import { join } from 'path';
import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// Get base directory for themes based on environment
const getThemesDir = () => {
  return join(process.cwd(), 'themes');
};

async function copyThemeAssets(sessionId: string, theme: string = 'default') {
  try {
    console.log(`Copying theme assets for theme: ${theme} to session: ${sessionId}`);
    const themeDir = join(getThemesDir(), theme);
    const sessionDir = getSessionDir(sessionId); // Use the same function that's used elsewhere
    
    if (!existsSync(themeDir)) {
      console.error(`Theme directory does not exist: ${themeDir}`);
      throw new Error(`Theme directory not found: ${theme}`);
    }
    
    // List of directories to copy
    const assetDirs = ['images', 'css', 'js'];
    for (const dir of assetDirs) {
      const sourceDir = join(themeDir, dir);
      const targetDir = join(sessionDir, dir);
      if (existsSync(sourceDir)) {
        console.log(`Copying directory: ${dir} from ${sourceDir} to ${targetDir}`);
        // Create target directory
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true });
        }
        // Copy directory contents
        await cp(sourceDir, targetDir, { recursive: true });
      } else {
        console.log(`Asset directory does not exist (skipping): ${sourceDir}`);
      }
    }
    
    // Copy any root-level static files (like theme.yaml)
    const staticFiles = ['theme.yaml', 'styles.css'];
    for (const file of staticFiles) {
      const sourcePath = join(themeDir, file);
      if (existsSync(sourcePath)) {
        console.log(`Copying file: ${file} to ${join(sessionDir, file)}`);
        await cp(sourcePath, join(sessionDir, file));
      } else {
        console.log(`Static file does not exist (skipping): ${sourcePath}`);
      }
    }
    console.log(`Theme assets successfully copied for session: ${sessionId}`);
  } catch (error) {
    console.error('Error copying theme assets:', error);
    throw error; // Re-throw to handle in the main request handler
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to create a new session');
    
    // Parse request body with error handling
    let body: CreateSessionRequest;
    try {
      body = await req.json();
      console.log('Request body parsed successfully:', { 
        theme: body.theme,
        contentLength: body.initialContent?.length || 0
      });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request data', 
        message: 'Failed to parse request body'
      }, { status: 400 });
    }
    
    // Validate required fields
    if (!body.initialContent) {
      console.error('Missing required field: initialContent');
      return NextResponse.json({ 
        error: 'Invalid request data', 
        message: 'Missing required field: initialContent'
      }, { status: 400 });
    }
    
    console.log('Creating session with theme:', body.theme || 'default');
    const session = await createSession({
      initialContent: body.initialContent,
      theme: body.theme,
    });
    
    console.log(`Session created successfully with ID: ${session.id}`);
    
    // Copy all theme assets to the session directory
    try {
      await copyThemeAssets(session.id, body.theme);
    } catch (themeError) {
      console.error(`Failed to copy theme assets but session was created. Session ID: ${session.id}`, themeError);
      // We'll continue and return the session anyway, as the core session was created
    }
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}