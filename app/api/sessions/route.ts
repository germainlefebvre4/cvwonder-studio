import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/sessions';
import { CreateSessionRequest } from '@/lib/types';
import { validateTheme } from '@/lib/themes';
import { installCVWonderTheme } from '@/lib/initialize-server';

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
    
    // Validate theme
    const theme = body.theme || 'default';
    const isThemeValid = await validateTheme(theme);
    if (!isThemeValid) {
      console.error(`Invalid theme: ${theme}`);
      return NextResponse.json({ 
        error: 'Invalid theme', 
        message: `Theme "${theme}" is not available`
      }, { status: 400 });
    }
    
    // Ensure theme is installed
    try {
      await installCVWonderTheme(theme);
    } catch (themeError) {
      console.error(`Failed to install theme ${theme}:`, themeError);
      return NextResponse.json({ 
        error: 'Theme installation failed', 
        message: `Failed to install theme: ${theme}`
      }, { status: 500 });
    }
    
    console.log('Creating session with theme:', theme);
    const session = await createSession({
      initialContent: body.initialContent,
      theme: theme,
      retentionDays: body.retentionDays
    });
    
    console.log(`Session created successfully with ID: ${session.id}`);
    
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