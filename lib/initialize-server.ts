import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdir, rm, cp } from 'fs/promises';

const execAsync = promisify(exec);

// Get base directory for writable operations based on environment
const getBaseDir = () => {
  // Check if we're running on AWS Lambda
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return '/tmp';
  }
  return process.cwd();
};

// Build the cvwonder binary URL with version support
const CVWONDER_VERSION = process.env.CVWONDER_VERSION || 'latest';
const CVWONDER_BASE_URL = 'https://github.com/germainlefebvre4/cvwonder/releases';
const CVWONDER_DOWNLOAD_URL = `${CVWONDER_BASE_URL}/${CVWONDER_VERSION}/download/cvwonder-linux-amd64`;

// Use appropriate directory paths based on environment
const BINARY_PATH = join(getBaseDir(), 'bin');
const CVWONDER_BINARY_PATH = join(BINARY_PATH, 'cvwonder');

// The source themes directory (read-only in Lambda)
const SOURCE_THEMES_DIR = join(process.cwd(), 'themes');
// The runtime themes directory (writable)
const RUNTIME_THEMES_DIR = join(getBaseDir(), 'themes');

// Official theme repository URLs
const DEFAULT_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-default';
const BASIC_THEME_REPO = 'https://github.com/germainlefebvre4/cvwonder-theme-basic';

// Check if a theme exists in either source or runtime location
function themeExists(themeName: string): boolean {
  const sourceThemePath = join(SOURCE_THEMES_DIR, themeName);
  const runtimeThemePath = join(RUNTIME_THEMES_DIR, themeName);
  
  return (
    (existsSync(sourceThemePath) && existsSync(join(sourceThemePath, 'index.html'))) ||
    (existsSync(runtimeThemePath) && existsSync(join(runtimeThemePath, 'index.html')))
  );
}

// Get the runtime path for a theme - create if needed by copying from source
async function getThemeRuntimePath(themeName: string): Promise<string> {
  const runtimePath = join(RUNTIME_THEMES_DIR, themeName);
  const sourcePath = join(SOURCE_THEMES_DIR, themeName);
  
  // If theme already exists in runtime directory, simply return the path
  if (existsSync(runtimePath) && existsSync(join(runtimePath, 'index.html'))) {
    return runtimePath;
  }
  
  // If the theme directory exists in the source, copy it to runtime
  if (existsSync(sourcePath) && existsSync(join(sourcePath, 'index.html'))) {
    // Make sure the runtime themes directory exists
    if (!existsSync(RUNTIME_THEMES_DIR)) {
      await mkdir(RUNTIME_THEMES_DIR, { recursive: true });
    }
    
    // Create the theme directory if it doesn't exist
    if (!existsSync(runtimePath)) {
      await mkdir(runtimePath, { recursive: true });
    }
    
    // Copy theme files from source to runtime
    console.log(`Copying theme ${themeName} from source to runtime location`);
    await cp(sourcePath, runtimePath, { recursive: true });
    
    return runtimePath;
  }
  
  // If the theme doesn't exist anywhere yet, return the runtime path for installation
  return runtimePath;
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
    }
    
    // Ensure runtime themes directory exists (no need to create source themes directory)
    if (!existsSync(RUNTIME_THEMES_DIR)) {
      console.log('Creating runtime themes directory at:', RUNTIME_THEMES_DIR);
      await mkdir(RUNTIME_THEMES_DIR, { recursive: true });
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
    // Check if default theme already exists in either source or runtime
    if (themeExists('default')) {
      console.log('Default theme found');
      // Make sure it's available in runtime directory
      await getThemeRuntimePath('default');
      return;
    }

    console.log('Installing default theme from repository:', DEFAULT_THEME_REPO);
    
    // Always install to the runtime directory
    const installPath = join(RUNTIME_THEMES_DIR, 'default');
    
    // Create runtime themes directory if it doesn't exist
    if (!existsSync(RUNTIME_THEMES_DIR)) {
      await mkdir(RUNTIME_THEMES_DIR, { recursive: true });
    }
    
    // Create or clean the theme directory
    if (!existsSync(installPath)) {
      await mkdir(installPath, { recursive: true });
    } else if (!existsSync(join(installPath, 'index.html'))) {
      // Remove incomplete theme directory
      await rm(installPath, { recursive: true, force: true });
      await mkdir(installPath, { recursive: true });
    }
    
    // Clone the default theme repository
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
    
    // If trying to use default theme, ensure it's installed
    if (themeName === 'default') {
      await ensureDefaultTheme();
      return true;
    }
    
    // Check if the theme exists in either source or runtime
    if (themeExists(themeName)) {
      // Make sure it's available in runtime directory
      await getThemeRuntimePath(themeName);
      console.log(`Theme ${themeName} is available`);
      return true;
    }
    
    console.log(`Installing CVWonder theme: ${themeName}`);
    
    // Always install to runtime directory
    const themeDir = join(RUNTIME_THEMES_DIR, 'default');
    
    // Create runtime themes directory if needed
    if (!existsSync(RUNTIME_THEMES_DIR)) {
      await mkdir(RUNTIME_THEMES_DIR, { recursive: true });
    }
    
    // If theme directory exists but is incomplete, remove it
    if (existsSync(themeDir)) {
      console.log(`Removing incomplete theme directory: ${themeDir}`);
      await rm(themeDir, { recursive: true, force: true });
    }
    
    // Create the theme directory
    await mkdir(themeDir, { recursive: true });
    
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
        
        // Copy default theme files to the requested theme directory
        await execAsync(`cp -r ${join(RUNTIME_THEMES_DIR, 'default', '*')} ${themeDir}`);
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

// Function to get the path to a theme that's guaranteed to be valid
export async function getValidThemePath(themeName: string): Promise<string> {
  // First try to get/create the runtime path
  try {
    return await getThemeRuntimePath(themeName);
  } catch (error) {
    // If that fails, check if it exists in the source path
    const sourcePath = join(SOURCE_THEMES_DIR, themeName);
    if (existsSync(sourcePath) && existsSync(join(sourcePath, 'index.html'))) {
      return sourcePath;
    }
    
    // If neither location has the theme, throw an error
    throw new Error(`Theme ${themeName} not found in any location`);
  }
}