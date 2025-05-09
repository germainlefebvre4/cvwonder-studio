import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdir, rm, cp } from 'fs/promises';
import prisma from './db';
import { initializeDefaultTheme } from './themes';
import { logger } from './logger';

const execAsync = promisify(exec);

// Get base directory based on environment
const getBaseDir = () => {
  // Check if we're running on AWS Lambda
  // if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
  //   return '/tmp';
  // }
  return process.cwd();
};

// Build the cvwonder binary URL with version support
const CVWONDER_VERSION = process.env.CVWONDER_VERSION;
const CVWONDER_BASE_URL = 'https://github.com/germainlefebvre4/cvwonder/releases';
const CVWONDER_DOWNLOAD_URL = `${CVWONDER_BASE_URL}/download/v${CVWONDER_VERSION}/cvwonder_linux_amd64`;

// Use appropriate directory paths based on environment
const BINARY_PATH = join(getBaseDir(), 'bin');
const CVWONDER_BINARY_PATH = join(BINARY_PATH, 'cvwonder');
const THEMES_DIR = join(process.cwd(), 'themes');  // Always read themes from codebase location

// Get runtime themes directory (where we write to in Lambda)
const getRuntimeThemeDir = (themeName: string) => {
  return join(process.cwd(), 'themes', themeName);
};

// Official theme repository URLs
const DEFAULT_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-default';
// const BASIC_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-basic';

// Initialize database with default data
export async function initializeDatabase() {
  logger.info('Initializing database...');
  
  try {
    // Initialize default theme in the database
    await initializeDefaultTheme();
    
    logger.info('Database initialization complete.');
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Master initialization function
export async function initializeServer() {
  logger.info('Initializing server...');
  
  try {
    // Initialize the database
    await initializeDatabase();
    
    // Download and setup the CVWonder binary
    await downloadCVWonderBinary();
    
    logger.info('Server initialization complete.');
    return true;
  } catch (error) {
    logger.error('Server initialization failed:', error);
    throw error;
  }
}

// Check if a theme exists in the themes directory
function themeExists(themeName: string): boolean {
  const themePath = join(THEMES_DIR, themeName);
  return existsSync(themePath) && existsSync(join(themePath, 'index.html'));
}

// Ensure the theme is available in the runtime directory if needed (for Lambda)
async function ensureRuntimeTheme(themeName: string): Promise<string> {
  // If we're running on Lambda, we need to copy themes to the /tmp directory
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sourcePath = join(THEMES_DIR, themeName); 
    const runtimePath = getRuntimeThemeDir(themeName);
    
    // Create runtime directory if it doesn't exist
    if (!existsSync(join(process.cwd(), 'themes'))) {
      await mkdir(join(process.cwd(), 'themes'), { recursive: true });
    }
    
    // If the theme exists in source but not in runtime, copy it
    if (existsSync(sourcePath) && !existsSync(runtimePath)) {
      logger.info(`Copying theme ${themeName} to runtime location: ${runtimePath}`);
      try {
        await mkdir(runtimePath, { recursive: true });
      } catch (error) {
        logger.warn(`Directory already exists: ${runtimePath}`);
      }
      await cp(sourcePath, runtimePath, { recursive: true });
    }
    
    return runtimePath;
  }
  
  // For non-Lambda environments, just use the original path
  return join(THEMES_DIR, themeName);
}

export async function downloadCVWonderBinary() {
  try {
    // Check if the binary directory exists, create if not
    if (!existsSync(BINARY_PATH)) {
      logger.info('Creating binary directory at:', BINARY_PATH);
      try {
        await mkdir(BINARY_PATH, { recursive: true });
      } catch (error) {
        logger.warn(`Directory already exists: ${BINARY_PATH}`);
      }
    }

    // Check if binary already exists
    if (!existsSync(CVWONDER_BINARY_PATH)) {
      logger.info('Downloading CVWonder binary from:', CVWONDER_DOWNLOAD_URL);
      
      // Download the binary with better error handling
      try {
        await execAsync(`curl -L ${CVWONDER_DOWNLOAD_URL} -o ${CVWONDER_BINARY_PATH}`);
      } catch (downloadError) {
        logger.error('Error downloading binary:', downloadError);
        throw new Error(`Failed to download CVWonder binary: ${downloadError instanceof Error ? downloadError.message : 'Unknown download error'}`);
      }
      
      // Make it executable
      try {
        await execAsync(`chmod +x ${CVWONDER_BINARY_PATH}`);
      } catch (chmodError) {
        logger.error('Error making binary executable:', chmodError);
        throw new Error(`Failed to make CVWonder binary executable: ${chmodError instanceof Error ? chmodError.message : 'Unknown chmod error'}`);
      }
      
      // Verify the binary exists and is executable
      if (!existsSync(CVWONDER_BINARY_PATH)) {
        throw new Error(`CVWonder binary was not created at ${CVWONDER_BINARY_PATH}`);
      }
      
      logger.info('CVWonder binary downloaded and made executable at:', CVWONDER_BINARY_PATH);
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to download CVWonder binary:', error);
    throw error;
  }
}

export async function installCVWonderTheme(themeName: string) {
  try {
    // Check if binary exists before trying to install themes
    if (!existsSync(CVWONDER_BINARY_PATH)) {
      logger.info('CVWonder binary not found, attempting to download...');
      await downloadCVWonderBinary();
    }
    
    // Create themes directory if it doesn't exist
    if (!existsSync(THEMES_DIR)) {
      logger.info('Creating themes directory at:', THEMES_DIR);
      try {
        await mkdir(THEMES_DIR, { recursive: true });
      } catch (error) {
        logger.warn(`Directory already exists: ${THEMES_DIR}`);
      }
    }

    // Fetch themes from database
    const themes = await prisma.theme.findMany({
      where: {
        slug: themeName,
      },
    });
    if (themes.length === 0) {
      throw new Error(`Theme ${themeName} not found in database`);
    }
    // Iterate over themes and download each one
    for (const theme of themes) {
      const themeDir = join(THEMES_DIR, theme.slug);
      const themeRepo = theme.githubRepoUrl;
      if (!existsSync(join(themeDir, 'index.html'))) {
        logger.info(`Cloning theme repository: ${themeRepo}`);
        try {
          await execAsync(`cd ${getBaseDir()} && ${CVWONDER_BINARY_PATH} theme install ${themeRepo}`);
          logger.info(`Theme ${themeName} retrieved successfully`);
        } catch (cloneError) {
          logger.error(`Error retrieving theme ${themeName}:`, cloneError);
          throw new Error(`Failed to retrieve theme ${themeName}`);
        }
        // Verify theme was installed
        if (!existsSync(join(themeDir, 'index.html'))) {
          throw new Error(`Theme ${themeName} installation verification failed`);
        }
        // Ensure the theme is available in the runtime directory
        const runtimeThemeDir = await ensureRuntimeTheme(themeName);
        if (!existsSync(join(runtimeThemeDir, 'index.html'))) {
          throw new Error(`Theme ${themeName} not found in runtime directory`);
        }
        logger.info(`Theme ${themeName} is ready at ${themeDir}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to install theme ${themeName}:`, error);
    throw error;
  }
}

// Function to get the full path to the cvwonder binary
export function getCVWonderBinaryPath() {
  // Use the same base directory logic to ensure consistency
  const binaryPath = join(getBaseDir(), 'bin', 'cvwonder');
  
  return binaryPath;
}
