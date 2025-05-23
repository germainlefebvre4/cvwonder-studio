import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/sessions';
import { UpdateSessionRequest } from '@/lib/types';
import { logger } from '@/lib/logger';

interface SessionParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: SessionParams) {
  try {
    const { id } = await params;
    const session = await getSession(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    logger.error(`Error fetching session:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: SessionParams) {
  try {
    const { id } = await params;
    const body: UpdateSessionRequest = await req.json();
    
    // Validate retention days if provided
    if (body.retentionDays !== undefined) {
      if (typeof body.retentionDays !== 'number' || body.retentionDays < 1 || body.retentionDays > 7) {
        return NextResponse.json({ 
          error: 'Invalid retention period', 
          message: 'Retention period must be between 1 and 7 days' 
        }, { status: 400 });
      }
    }
    
    const session = await updateSession(id, body);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    logger.error(`Error updating session:`, error);
    return NextResponse.json({ 
      error: 'Failed to update session', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}