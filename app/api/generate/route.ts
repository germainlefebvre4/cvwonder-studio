import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm, readFile, cp } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { downloadCVWonderBinary, getCVWonderBinaryPath, installCVWonderTheme } from '@/lib/initialize-server';

const execAsync = promisify(exec);

// Download cvwonder binary when server initializes - wrapped in a try/catch
try {
  downloadCVWonderBinary();
} catch (error) {
  console.error('Error during cvwonder binary initialization:', error);
}

async function ensureSessionImages(sessionId: string, themeDir: string) {
  const sessionImagesDir = join(process.cwd(), 'sessions', sessionId, 'images');
  const themeImagesDir = join(themeDir, 'images');

  try {
    // Create session images directory if it doesn't exist
    if (!existsSync(sessionImagesDir)) {
      await mkdir(sessionImagesDir, { recursive: true });
    }

    // Copy theme images to session directory if theme images exist
    if (existsSync(themeImagesDir)) {
      await cp(themeImagesDir, sessionImagesDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error setting up session images:', error);
  }
}

function updateImagePaths(html: string, sessionId: string): string {
  // Remove any existing /api/sessions or /session prefixes from image paths
  html = html.replace(
    /src=["'](?:\/api\/sessions\/[^\/]+\/images\/|\/session\/[^\/]+\/images\/|\/images\/|)(.*?\.(?:png|jpe?g|gif|webp|svg))["']/g,
    `src="/api/sessions/${sessionId}/images/$1"`
  );
  
  // Handle paths that start with just 'images/'
  html = html.replace(
    /src=["'](images\/.*?\.(?:png|jpe?g|gif|webp|svg))["']/g,
    `src="/api/sessions/${sessionId}/images/$1"`
  );
  
  return html;
}

export async function POST(req: NextRequest) {
  try {
    const { cv, theme, format = 'html', sessionId } = await req.json();
    
    // Input validation
    if (!cv || typeof cv !== 'string' || cv.trim() === '') {
      return NextResponse.json({ error: 'CV content is required and must be a non-empty string' }, { status: 400 });
    }
    
    if (!theme || typeof theme !== 'string') {
      return NextResponse.json({ error: 'Theme is required and must be a string' }, { status: 400 });
    }
    
    if (format !== 'html' && format !== 'pdf') {
      return NextResponse.json({ error: 'Format must be either "html" or "pdf"' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'tmp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Create output directory
    const outputDir = join(tempDir, 'output');
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Make sure the cvwonder binary exists
    const cvwonderPath = getCVWonderBinaryPath();
    if (!existsSync(cvwonderPath)) {
      try {
        await downloadCVWonderBinary();
      } catch (downloadError) {
        console.error('Failed to download CVWonder binary:', downloadError);
        return NextResponse.json({ 
          error: 'CVWonder binary not found and could not be downloaded.', 
          message: downloadError instanceof Error ? downloadError.message : 'Unknown error' 
        }, { status: 500 });
      }
      
      if (!existsSync(cvwonderPath)) {
        return NextResponse.json({ 
          error: 'CVWonder binary not found after download attempt.' 
        }, { status: 500 });
      }
    }

    // Make sure the selected theme is installed
    try {
      await installCVWonderTheme(theme);
    } catch (themeError) {
      console.error(`Error installing theme ${theme}:`, themeError);
    }

    // Set up session images directory and copy theme images
    const themeDir = join(process.cwd(), 'themes', theme);
    await ensureSessionImages(sessionId, themeDir);

    // Write CV YAML to temp file
    const cvPath = join(tempDir, 'cv.yml');
    try {
      await writeFile(cvPath, cv);
      if (!existsSync(cvPath)) {
        throw new Error(`Failed to create CV file at ${cvPath}`);
      }
      console.log(`CV file written successfully to ${cvPath}`);
    } catch (writeError) {
      console.error('Error writing CV file:', writeError);
      return NextResponse.json({ 
        error: 'Failed to write CV file', 
        message: writeError instanceof Error ? writeError.message : 'Unknown error' 
      }, { status: 500 });
    }

    // Generate CV
    const command = `"${cvwonderPath}" generate --input "${cvPath}" --theme "${theme}" --format "${format}" --output "${outputDir}"`;
    console.info('Executing command:', command);
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.info('Command stdout:', stdout);
      if (stderr) {
        console.warn('CVWonder command stderr:', stderr);
        if (stderr.includes('invalid argument')) {
          const fallbackCommand = `${cvwonderPath} generate -i "${cvPath}" -t "${theme}" -f "${format}" -o "${outputDir}"`;
          console.log('Trying fallback command:', fallbackCommand);
          try {
            const fallbackResult = await execAsync(fallbackCommand);
            console.log('Fallback command stdout:', fallbackResult.stdout);
            if (fallbackResult.stderr) {
              console.warn('Fallback command stderr:', fallbackResult.stderr);
            }
          } catch (fallbackError) {
            console.error('Fallback command also failed:', fallbackError);
            throw fallbackError;
          }
        }
      }
    } catch (execError) {
      console.error('Error executing CVWonder command:', execError);
      if ((execError as any).stderr) {
        console.error('Command stderr:', (execError as any).stderr);
      }
      return NextResponse.json({ 
        error: 'Failed to generate CV', 
        message: execError instanceof Error ? 
          (execError.message + ((execError as any).stderr ? `: ${(execError as any).stderr}` : '')) : 
          'Unknown error during generation',
        command: command
      }, { status: 500 });
    }

    const outputFile = format === 'pdf' ? 'cv.pdf' : 'cv.html';
    const outputPath = join(outputDir, outputFile);
    
    if (!existsSync(outputPath)) {
      return NextResponse.json({ 
        error: 'CVWonder failed to generate the output file', 
        path: outputPath
      }, { status: 500 });
    }

    let fileContent;
    try {
      fileContent = await readFile(outputPath, format === 'pdf' ? null : 'utf-8');
      
      // If it's HTML, update image paths to use our API endpoint
      if (format === 'html' && typeof fileContent === 'string') {
        fileContent = updateImagePaths(fileContent, sessionId);
      }
    } catch (readError) {
      console.error('Error reading generated file:', readError);
      return NextResponse.json({ 
        error: 'Failed to read generated file', 
        message: readError instanceof Error ? readError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    const content = new Blob([fileContent], { 
      type: format === 'pdf' ? 'application/pdf' : 'text/html' 
    });

    return new NextResponse(content, {
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/html',
        'Content-Disposition': format === 'pdf' ? 'attachment; filename="cv.pdf"' : 'inline',
      },
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate CV', 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
    }, { status: 500 });
  }
}