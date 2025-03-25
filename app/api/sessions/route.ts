import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/sessions';
import { CreateSessionRequest } from '@/lib/types';
import { join } from 'path';
import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

async function copyThemeAssets(sessionId: string, theme: string = 'default') {
  const themeDir = join(process.cwd(), 'themes', theme);
  const sessionDir = join(process.cwd(), 'sessions', sessionId);

  // List of directories to copy
  const assetDirs = ['images', 'css', 'js'];

  for (const dir of assetDirs) {
    const sourceDir = join(themeDir, dir);
    const targetDir = join(sessionDir, dir);

    if (existsSync(sourceDir)) {
      // Create target directory
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      // Copy directory contents
      await cp(sourceDir, targetDir, { recursive: true });
    }
  }

  // Copy any root-level static files (like theme.yaml)
  const staticFiles = ['theme.yaml', 'styles.css'];
  for (const file of staticFiles) {
    const sourcePath = join(themeDir, file);
    if (existsSync(sourcePath)) {
      await cp(sourcePath, join(sessionDir, file));
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateSessionRequest = await req.json();
    
    const session = await createSession({
      initialContent: body.initialContent,
      theme: body.theme,
    });

    // Copy all theme assets to the session directory
    await copyThemeAssets(session.id, body.theme);
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}