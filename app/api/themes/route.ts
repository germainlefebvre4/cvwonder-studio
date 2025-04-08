import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readFile, cp } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getSession } from '@/lib/sessions';
import { getAllThemes } from '@/lib/themes';

const execAsync = promisify(exec);

// Type definition for exec errors
interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
  code?: number;
}

// Get writable base directory depending on environment
const getWritableBaseDir = () => {
  return process.cwd();
};

export async function GET(req: NextRequest) {
  try {
    const themes = await getAllThemes()
      .then((themes) => {
        return themes.map((theme) => ({
          name: theme.name,
          description: theme.description,
          githubRepoUrl: theme.githubRepoUrl,
          previewUrl: theme.previewUrl,
        }));
      })
      .catch((error) => {
        console.error('Error fetching themes:', error);
        return [];
      });
    return NextResponse.json(themes);
  }
  catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
