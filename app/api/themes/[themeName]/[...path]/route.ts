import { join } from 'path';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';
import { logger } from '@/lib/logger';

const MIME_TYPES: Record<string, string> = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.html': 'text/html',
  '.txt': 'text/plain',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  // Image types
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// Get writable base directory depending on environment
const getThemesBaseDir = () => {
  // Check if we're running on AWS Lambda
  // if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
  //   return '/tmp';
  // }
  return process.cwd();
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ themeName: string; path: string[] }> }
) {
  try {
    const { themeName, path } = await params;
    
    // Use the theme from the session
    const theme = themeName;
    
    // Join the path parts
    const filePath = path.join('/');
    
    // List of possible locations to look for the file
    const possiblePaths = [
      // Theme-specific files from the session's theme
      join(getThemesBaseDir(), `themes/${theme}`, filePath),
      // Fallback to default theme files
      // join(getThemesBaseDir(), 'themes/default', filePath),
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
      logger.error('File not found:', {
        themeName: themeName,
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
    logger.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}