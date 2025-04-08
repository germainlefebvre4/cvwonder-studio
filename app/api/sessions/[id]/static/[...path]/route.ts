import { join } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html',
  '.txt': 'text/plain',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
};

// Get writable base directory depending on environment
const getWritableBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return '/tmp';
  }
  return process.cwd();
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; path: string[] } }
) {
  try {
    const { id, path } = params;
    
    // Get session information from database to determine theme
    const session = await getSession(id);
    if (!session) {
      console.error('Session not found:', id);
      return new NextResponse('Session not found', { status: 404 });
    }
    
    // Use the theme from the session
    const theme = session.selectedTheme || 'default';
    
    // Join the path parts and remove any 'static' prefix if it exists
    const filePath = path.join('/').replace(/^(?:static|css|js)\//, '');
    
    // List of possible locations to look for the file
    const possiblePaths = [
      // Theme-specific files from the session's theme
      join(getWritableBaseDir(), `themes/${theme}`, filePath),
      join(getWritableBaseDir(), `themes/${theme}/css`, filePath),
      join(getWritableBaseDir(), `themes/${theme}/js`, filePath),
      // Fallback to default theme files
      join(getWritableBaseDir(), 'themes/default', filePath),
      join(getWritableBaseDir(), 'themes/default/css', filePath),
      join(getWritableBaseDir(), 'themes/default/js', filePath),
    ];
    
    // Try each possible path until we find the file
    let finalPath: string | undefined;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        finalPath = path;
        break;
      }
    }

    if (!finalPath) {
      console.error('File not found:', {
        sessionId: id,
        requestedPath: filePath,
        triedPaths: possiblePaths
      });
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileContent = await readFile(finalPath);
    
    // Determine content type based on file extension
    const extension = '.' + filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    // Return the file with proper content type
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': Buffer.from(fileContent).toString('base64').slice(0, 27),
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}