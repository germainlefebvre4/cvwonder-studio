import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdir, rm, cp } from 'fs/promises';

const execAsync = promisify(exec);

// Get base directory based on environment
const getBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  return process.cwd();
};

// Build the cvwonder binary URL with version support
const CVWONDER_VERSION = process.env.CVWONDER_VERSION || 'v0.3.0';
const CVWONDER_BASE_URL = 'https://github.com/germainlefebvre4/cvwonder/releases';
const CVWONDER_DOWNLOAD_URL = `${CVWONDER_BASE_URL}/download/${CVWONDER_VERSION}/cvwonder_linux_amd64`;

// Use appropriate directory paths based on environment
const BINARY_PATH = join(getBaseDir(), 'bin');
const CVWONDER_BINARY_PATH = join(BINARY_PATH, 'cvwonder');
const THEMES_DIR = join(process.cwd(), 'themes');  // Always read themes from codebase location

// Get runtime themes directory (where we write to in Lambda)
const getRuntimeThemeDir = (themeName: string) => {
  return join(getBaseDir(), 'themes', themeName);
};

// Official theme repository URLs
const DEFAULT_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-default';
const BASIC_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-basic';

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
    if (!existsSync(join(getBaseDir(), 'themes'))) {
      await mkdir(join(getBaseDir(), 'themes'), { recursive: true });
    }
    
    // If the theme exists in source but not in runtime, copy it
    if (existsSync(sourcePath) && !existsSync(runtimePath)) {
      console.log(`Copying theme ${themeName} to runtime location: ${runtimePath}`);
      await mkdir(runtimePath, { recursive: true });
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
      console.log('Creating binary directory at:', BINARY_PATH);
      await mkdir(BINARY_PATH, { recursive: true });
    }

    // Check if binary already exists
    if (existsSync(CVWONDER_BINARY_PATH)) {
      console.log('CVWonder binary already exists at:', CVWONDER_BINARY_PATH);
    } else {
      console.log('Downloading CVWonder binary from:', CVWONDER_DOWNLOAD_URL);
      
      // Download the binary with better error handling
      try {
        await execAsync(`curl -L ${CVWONDER_DOWNLOAD_URL} -o ${CVWONDER_BINARY_PATH}`);
      } catch (downloadError) {
        console.error('Error downloading binary:', downloadError);
        throw new Error(`Failed to download CVWonder binary: ${downloadError instanceof Error ? downloadError.message : 'Unknown download error'}`);
      }
      
      // Make it executable
      try {
        await execAsync(`chmod +x ${CVWONDER_BINARY_PATH}`);
      } catch (chmodError) {
        console.error('Error making binary executable:', chmodError);
        throw new Error(`Failed to make CVWonder binary executable: ${chmodError instanceof Error ? chmodError.message : 'Unknown chmod error'}`);
      }
      
      // Verify the binary exists and is executable
      if (!existsSync(CVWONDER_BINARY_PATH)) {
        throw new Error(`CVWonder binary was not created at ${CVWONDER_BINARY_PATH}`);
      }
      
      console.log('CVWonder binary downloaded and made executable at:', CVWONDER_BINARY_PATH);
      
      // Test that the binary works
      // try {
      //   const { stdout } = await execAsync(`${CVWONDER_BINARY_PATH} --version`);
      //   console.log('CVWonder version:', stdout.trim());
      // } catch (versionError) {
      //   console.warn('Could not verify CVWonder version:', versionError);
      //   // Don't throw here, as the binary might still work for our purposes
      // }
    }
    
    // Create the themes directory if it doesn't exist
    if (!existsSync(THEMES_DIR)) {
      console.log('Creating themes directory at:', THEMES_DIR);
      await mkdir(THEMES_DIR, { recursive: true });
    }
    
    // Download and install the default theme
    await ensureDefaultTheme();
    
    return true;
  } catch (error) {
    console.error('Failed to download CVWonder binary:', error);
    throw error;
  }
}

async function ensureDefaultTheme() {
  try {
    // Check if themes directory exists
    if (!existsSync(THEMES_DIR)) {
      console.log('Themes directory does not exist in source code location');
    }

    // Check if default theme already exists
    if (themeExists('default')) {
      console.log('Default theme found in theme directory');
      await ensureRuntimeTheme('default');
      return;
    }

    console.log('Installing default theme from repository:', DEFAULT_THEME_REPO);
    
    // Determine where to install the theme (source or runtime location)
    const installPath = process.env.AWS_LAMBDA_FUNCTION_NAME ? 
      getRuntimeThemeDir('default') : 
      join(THEMES_DIR, 'default');
    
    // Create directory if needed
    if (!existsSync(installPath)) {
      await mkdir(installPath, { recursive: true });
    } else {
      // Remove incomplete theme directory if it exists but is incomplete
      if (!existsSync(join(installPath, 'index.html'))) {
        await rm(installPath, { recursive: true, force: true });
        await mkdir(installPath, { recursive: true });
      }
    }
    
    // Clone the theme repository
    try {
      await execAsync(`git clone ${DEFAULT_THEME_REPO} ${installPath}`);
      console.log('Default theme cloned successfully');
    } catch (cloneError) {
      console.error('Error cloning default theme:', cloneError);
      
      // Try alternative installation methods
      try {
        console.log('Attempting to install default theme using cvwonder command');
        await execAsync(`${CVWONDER_BINARY_PATH} theme install ${DEFAULT_THEME_REPO}`);
        console.log('Default theme installed successfully using cvwonder command');
      } catch (installError) {
        console.error('Error installing default theme with cvwonder:', installError);
        throw new Error('Failed to install default theme by any method');
      }
    }
    
    // Verify theme was installed
    if (!existsSync(join(installPath, 'index.html'))) {
      throw new Error('Default theme installation verification failed');
    }
    
    console.log('Default theme setup complete');
  } catch (error) {
    console.error('Error setting up default theme:', error);
    throw error;
  }
}

export async function installCVWonderTheme(themeName: string) {
  try {
    // Check if binary exists before trying to install themes
    if (!existsSync(CVWONDER_BINARY_PATH)) {
      console.log('CVWonder binary not found, attempting to download...');
      await downloadCVWonderBinary();
    }
    
    // Create themes directory if it doesn't exist
    if (!existsSync(THEMES_DIR)) {
      console.log('Creating themes directory at:', THEMES_DIR);
      await mkdir(THEMES_DIR, { recursive: true });
    }

    // If trying to use default theme, ensure it's installed
    if (themeName === 'default') {
      await ensureDefaultTheme();
      return true;
    }

    // Check if the theme exists in either location and ensure it's in runtime
    if (themeExists(themeName)) {
      const themeDir = await ensureRuntimeTheme(themeName);
      console.log(`Theme ${themeName} is available at ${themeDir}`);
      return true;
    }
    
    console.log(`Installing CVWonder theme: ${themeName}`);
    
    // Theme will be installed to runtime directory
    const themeDir = join(THEMES_DIR, themeName);
    
    // If theme directory exists but is incomplete, remove it
    if (existsSync(themeDir)) {
      console.log(`Removing incomplete theme directory: ${themeDir}`);
      await rm(themeDir, { recursive: true, force: true });
    }
    
    // Determine the theme repository URL
    let themeRepo = '';
    if (themeName === 'basic') {
      themeRepo = BASIC_THEME_REPO;
    } else {
      // For other themes, attempt to guess the URL pattern
      themeRepo = `https://github.com/germainlefebvre4/cvwonder-theme-${themeName}`;
    }
    
    // Try to clone the theme repository
    try {
      console.log(`Cloning theme repository: ${themeRepo}`);
      await execAsync(`git clone ${themeRepo} ${themeDir}`);
      console.log(`Theme ${themeName} cloned successfully to: ${themeDir}`);
    } catch (cloneError) {
      console.error(`Error cloning theme ${themeName}:`, cloneError);
      
      // If git clone fails, try using cvwonder theme install command
      try {
        console.log(`Attempting to install theme ${themeName} using cvwonder command`);
        await execAsync(`${CVWONDER_BINARY_PATH} theme install ${themeRepo}`);
        console.log(`Theme ${themeName} installed successfully using cvwonder command`);
      } catch (installError) {
        console.error(`Error installing theme ${themeName} with cvwonder:`, installError);
        
        // If both methods fail, fall back to copying default theme
        console.log(`Falling back to using default theme for ${themeName}`);
        await ensureDefaultTheme();
        
        // Create directory for requested theme if it doesn't exist
        if (!existsSync(themeDir)) {
          await mkdir(themeDir, { recursive: true });
        }
        
        // Copy default theme files to the requested theme directory
        await execAsync(`cp -r ${join(THEMES_DIR, 'default', '*')} ${themeDir}`);
      }
    }
    
    // Verify theme was installed
    if (!existsSync(join(themeDir, 'index.html'))) {
      throw new Error(`Theme ${themeName} installation verification failed`);
    }
    
    console.log(`Theme ${themeName} is ready at ${themeDir}`);
    return true;
  } catch (error) {
    console.error(`Failed to install theme ${themeName}:`, error);
    throw error;
  }
}

// Function to get the full path to the cvwonder binary
export function getCVWonderBinaryPath() {
  // Use the same base directory logic to ensure consistency
  const binaryPath = join(getBaseDir(), 'bin', 'cvwonder');
  
  // Log the binary path for debugging purposes
  console.log('CVWonder binary path:', binaryPath);
  
  return binaryPath;
}