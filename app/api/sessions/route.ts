import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/sessions';
import { CreateSessionRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: CreateSessionRequest = await req.json();
    
    const session = await createSession({
      initialContent: body.initialContent,
      theme: body.theme,
    });
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}