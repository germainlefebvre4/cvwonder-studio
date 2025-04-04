import { join } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Get writable base directory depending on environment
const getWritableBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return '/tmp';
  }
  return '/tmp';
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
    
    // Join the path parts but remove any 'images' prefix if it exists
    const imagePath = path.join('/').replace(/^images\//, '');
    
    // List of possible locations to look for the image
    const possiblePaths = [
      // Theme-specific images from the session's theme
      join(getWritableBaseDir(), `themes/${theme}/images`, imagePath),
      // Fallback to default theme images
      join(getWritableBaseDir(), 'themes/default/images', imagePath),
    ];
    
    // Try each possible path until we find the image
    let finalPath: string | undefined;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        finalPath = path;
        break;
      }
    }

    if (!finalPath) {
      console.error('Image not found:', {
        sessionId: id,
        requestedPath: imagePath,
        triedPaths: possiblePaths
      });
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the image file
    const imageBuffer = await readFile(finalPath);
    
    // Determine content type based on file extension
    const extension = '.' + imagePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    // Return the image with proper content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'ETag': Buffer.from(imageBuffer).toString('base64').slice(0, 27),
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}