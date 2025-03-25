import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/sessions';
import { CreateSessionRequest } from '@/lib/types';
import { join } from 'path';
import { cp, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

async function copyDefaultImages(sessionId: string) {
  const defaultImagesPath = join(process.cwd(), 'themes/default/images');
  const sessionImagesPath = join(process.cwd(), 'sessions', sessionId, 'images');

  // Create session images directory
  if (!existsSync(sessionImagesPath)) {
    await mkdir(sessionImagesPath, { recursive: true });
  }

  // Copy default theme images if they exist
  if (existsSync(defaultImagesPath)) {
    await cp(defaultImagesPath, sessionImagesPath, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateSessionRequest = await req.json();
    
    const session = await createSession({
      initialContent: body.initialContent,
      theme: body.theme,
    });

    // Copy default images to the session directory
    await copyDefaultImages(session.id);
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}