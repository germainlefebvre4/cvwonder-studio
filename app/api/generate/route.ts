import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
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

export async function POST(req: NextRequest) {
  try {
    const { cv, theme, format = 'html' } = await req.json();
    
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
      // If binary doesn't exist, try to download it
      try {
        await downloadCVWonderBinary();
      } catch (downloadError) {
        console.error('Failed to download CVWonder binary:', downloadError);
        return NextResponse.json({ 
          error: 'CVWonder binary not found and could not be downloaded.', 
          message: downloadError instanceof Error ? downloadError.message : 'Unknown error' 
        }, { status: 500 });
      }
      
      // Verify again after download attempt
      if (!existsSync(cvwonderPath)) {
        return NextResponse.json({ 
          error: 'CVWonder binary not found after download attempt.' 
        }, { status: 500 });
      }
    }

    // Make sure the selected theme is installed before generation
    try {
      await installCVWonderTheme(theme);
    } catch (themeError) {
      console.error(`Error installing theme ${theme}:`, themeError);
      // Continue anyway, as we've implemented a fallback in the theme installation
    }

    // Write CV YAML to temp file - using cv.yml for consistency
    const cvPath = join(tempDir, 'cv.yml');
    try {
      await writeFile(cvPath, cv);
      
      // Verify the file was created
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

    // Generate CV using cvwonder with proper directory for output
    const command = `${cvwonderPath} generate --input=${cvPath} --theme=${theme} --format=${format} --output=${outputDir}`;
    
    console.log('Executing command:', command);
    
    try {
      const { stdout, stderr } = await execAsync(command);
      
      console.log('Command stdout:', stdout);
      if (stderr) {
        console.warn('CVWonder command stderr:', stderr);
      }
    } catch (execError) {
      console.error('Error executing CVWonder command:', execError);
      return NextResponse.json({ 
        error: 'Failed to generate CV', 
        message: execError instanceof Error ? 
          (execError.message + (execError as any).stderr ? `: ${(execError as any).stderr}` : '') : 
          'Unknown error during generation'
      }, { status: 500 });
    }

    // The output file will be named based on the format
    // cvwonder creates cv.html and cv.pdf, not index.html
    const outputFile = format === 'pdf' ? 'cv.pdf' : 'cv.html';
    const outputPath = join(outputDir, outputFile);
    
    // Check if the output file was actually created
    if (!existsSync(outputPath)) {
      return NextResponse.json({ 
        error: 'CVWonder failed to generate the output file', 
        path: outputPath
      }, { status: 500 });
    }

    // Read the generated file
    let fileContent;
    try {
      fileContent = await readFile(outputPath);
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

    // Return the generated content with appropriate headers
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