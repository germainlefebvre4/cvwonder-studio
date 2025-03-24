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
      throw new Error('CVWonder binary not found. Please ensure it is properly installed.');
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
      throw new Error(`Failed to write CV file: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`);
    }

    // Generate CV using cvwonder with proper directory for output
    // The cvwonder tool expects:
    // 1. The theme to be a directory name in themes/
    // 2. The output to be a directory where it will create index.html or cv.pdf
    const command = `${cvwonderPath} generate --input=${cvPath} --theme=${theme} --format=${format} --output=${outputDir}`;
    
    console.log('Executing command:', command);
    const { stdout, stderr } = await execAsync(command);
    
    console.log('Command stdout:', stdout);
    if (stderr) {
      console.warn('CVWonder command stderr:', stderr);
    }

    // The output file will be named based on the format
    // cvwonder creates cv.html and cv.pdf, not index.html
    const outputFile = format === 'pdf' ? 'cv.pdf' : 'cv.html';
    const outputPath = join(outputDir, outputFile);
    
    // Check if the output file was actually created
    if (!existsSync(outputPath)) {
      // List files in the output directory for debugging
      const outputDirFiles = await readFile(outputDir, { withFileTypes: true });
      console.log('Files in output directory:', outputDirFiles.map(f => f.name).join(', '));
      throw new Error(`CVWonder failed to generate the output file at ${outputPath}`);
    }

    // Read the generated file
    const fileContent = await readFile(outputPath);
    const content = new Blob([fileContent], { 
      type: format === 'pdf' ? 'application/pdf' : 'text/html' 
    });

    // Clean up temp files (but keep the directories)
    try {
      // Don't remove the files for debugging purposes
      // await rm(cvPath, { force: true });
      // await rm(outputPath, { force: true });
    } catch (cleanupError) {
      console.warn('Error cleaning up temp files:', cleanupError);
    }

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