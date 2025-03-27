import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm, readFile, cp } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { downloadCVWonderBinary, getCVWonderBinaryPath, installCVWonderTheme } from '@/lib/initialize-server';
import { getBaseDir, getSessionCVPath, getSessionCVBlobUrl } from '@/lib/sessions';
import * as blobStore from '@vercel/blob';

const execAsync = promisify(exec);

// Type definition for exec errors
interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
  code?: number;
}

// Get writable base directory depending on environment
const getWritableBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    // console.log('Using /tmp directory for binary storage (Lambda/production environment)');
    return '/tmp';
  }
  // console.log('Using local directory for binary storage (development environment)');
  return '/tmp';
  return process.cwd();
};

// Download cvwonder binary when server initializes - wrapped in a try/catch
try {
  downloadCVWonderBinary();
} catch (error) {
  console.error('Error during cvwonder binary initialization:', error);
}

async function ensureSessionFiles(sessionId: string, themeDir: string) {
  const sessionDir = join(getWritableBaseDir(), 'sessions', sessionId);

  try {
    // Create session directories if they don't exist
    const dirsToCreate = ['images', 'static', 'css', 'js'].map(dir => join(sessionDir, dir));
    for (const dir of dirsToCreate) {
      if (!existsSync(dir)) {
        try {
          await mkdir(dir, { recursive: true });
        } catch (error) {
          console.warn(`Direcotry already exists: ${dir}`);
        }
      }
    }

    // Copy theme files to session directory
    const filesToCopy = [
      { src: join(themeDir, 'styles.css'), dest: join(sessionDir, 'static', 'styles.css') },
      // { src: join(themeDir, 'theme.yaml'), dest: join(sessionDir, 'static', 'theme.yaml') }
    ];

    // Copy theme directories
    const dirsToCopy = ['images', 'css', 'js'];
    
    // Copy individual files
    for (const file of filesToCopy) {
      if (existsSync(file.src)) {
        await cp(file.src, file.dest);
      }
    }

    // Copy directories
    for (const dir of dirsToCopy) {
      const srcDir = join(themeDir, dir);
      const destDir = join(sessionDir, dir);
      if (existsSync(srcDir)) {
        try {
          await cp(srcDir, destDir, { recursive: true, force: true });
        } catch (error) {
          console.warn(`Directory already exists: ${destDir}`);
        }
      }
    }
  } catch (error) {
    console.error('Error setting up session files:', error);
  }
}

function updatePaths(html: string, sessionId: string): string {
  // Update CSS file paths
  html = html.replace(
    /href=["'](?:\/styles\.css|styles\.css)["']/g,
    `href="/api/sessions/${sessionId}/static/styles.css"`
  );

  // Update other static file paths (CSS, JS)
  html = html.replace(
    /(href|src)=["']((?:css|js)\/[^"']+)["']/g,
    `$1="/api/sessions/${sessionId}/static/$2"`
  );
  
  // Update image paths
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

// Function to determine if an error is just a warning about temporary file removal
function isTemporaryFileWarning(stderr: string): boolean {
  return stderr.includes('Error removing output tmp file') && 
         (stderr.includes('no such file or directory') || stderr.includes('tmp: cannot remove'));
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
    // const tempDir = join(getWritableBaseDir(), 'tmp');
    // if (!existsSync(tempDir)) {
    //   await mkdir(tempDir, { recursive: true });
    // }

    // Create output directory
    const outputDir = join(getWritableBaseDir(), 'sessions', sessionId);
    if (!existsSync(outputDir)) {
      try {
        await mkdir(outputDir, { recursive: true });
      } catch (error) {
        console.warn(`Directory already exists: ${outputDir}`);
      }
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

    // Make sure the selected theme is installed and files are copied to session
    try {
      await installCVWonderTheme(theme);
      const themeDir = join(getWritableBaseDir(), 'themes', theme);
      await ensureSessionFiles(sessionId, themeDir);
    } catch (themeError) {
      console.error(`Error setting up theme ${theme}:`, themeError);
    }

    // Store CV YAML in Vercel Blob storage
    try {
      await blobStore.put(getSessionCVBlobUrl(sessionId), cv, { access: 'public' });
      console.log(`CV file written successfully to Blob: sessions/${sessionId}/cv.yml`);
    } catch (writeError) {
      console.error('Error writing CV file to Blob:', writeError);
      return NextResponse.json({ 
        error: 'Failed to write CV file to Blob storage', 
        message: writeError instanceof Error ? writeError.message : 'Unknown error' 
      }, { status: 500 });
    }
    
    // We also need to write the CV file locally for the cvwonder binary to use
    const cvPath = getSessionCVPath(sessionId);
    try {
      // Ensure the directory exists
      const dirPath = join(getWritableBaseDir(), 'sessions', sessionId);
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }
      
      // Write the file
      await writeFile(cvPath, cv);
      if (!existsSync(cvPath)) {
        throw new Error(`Failed to create temporary CV file at ${cvPath}`);
      }
    } catch (writeError) {
      console.error('Error writing temporary CV file:', writeError);
      return NextResponse.json({ 
        error: 'Failed to write temporary CV file', 
        message: writeError instanceof Error ? writeError.message : 'Unknown error' 
      }, { status: 500 });
    }

    // Generate CV
    const command = `cd ${process.cwd()} && ${cvwonderPath} generate --input="${cvPath}" --theme="${theme}" --format="${format}" --output="${outputDir}"`;
    console.info('Executing command:', command);
    
    try {
      const { stdout, stderr } = await execAsync(command);
      console.info('Command stdout:', stdout);
      // if (stderr) {
      //   // Only log temporary file warnings, don't treat them as errors
      //   if (isTemporaryFileWarning(stderr)) {
      //     console.log('Harmless warning about temporary files (can be ignored):', stderr);
      //   } else {
      //     console.warn('CVWonder command stderr:', stderr);
      //     if (stderr.includes('invalid argument')) {
      //       const fallbackCommand = `cd ${process.cwd()} && ${cvwonderPath} generate -i "${cvPath}" -t "${theme}" -f "${format}" -o "${outputDir}"`;
      //       console.log('Trying fallback command:', fallbackCommand);
      //       try {
      //         const fallbackResult = await execAsync(fallbackCommand);
      //         console.log('Fallback command stdout:', fallbackResult.stdout);
      //         if (fallbackResult.stderr && !isTemporaryFileWarning(fallbackResult.stderr)) {
      //           console.warn('Fallback command stderr:', fallbackResult.stderr);
      //         }
      //       } catch (fallbackError) {
      //         console.error('Fallback command also failed:', fallbackError);
      //         throw fallbackError;
      //       }
      //     }
      //   }
      // }
    } catch (execError: unknown) {
      // Type cast the error to our custom interface
      const typedError = execError as ExecError;
      
      // Check if this is just a temporary file warning
      if (typedError.stderr && isTemporaryFileWarning(typedError.stderr)) {
        // This is just a warning, not an actual error
        console.log('Command succeeded despite warnings about temporary files:', typedError.stderr);
      } else {
        console.error('Error executing CVWonder command:', typedError);
        if (typedError.stderr) {
          console.error('Command stderr:', typedError.stderr);
        }
        return NextResponse.json({ 
          error: 'Failed to generate CV', 
          message: typedError instanceof Error ? 
            (typedError.message + (typedError.stderr ? `: ${typedError.stderr}` : '')) : 
            'Unknown error during generation',
          command: command
        }, { status: 500 });
      }
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
      
      // If it's HTML, update paths to use our API endpoints
      if (format === 'html' && typeof fileContent === 'string') {
        fileContent = updatePaths(fileContent, sessionId);
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