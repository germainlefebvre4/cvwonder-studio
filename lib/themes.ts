import prisma from './db';

// All theme-related functionality

/**
 * Validate if a theme exists in the database
 */
export const validateTheme = async (themeName: string = 'default'): Promise<boolean> => {
  try {
    const theme = await prisma.theme.findUnique({
      where: { name: themeName }
    });
    return !!theme;
  } catch (error) {
    console.error(`Error validating theme ${themeName}:`, error);
    return false;
  }
};

/**
 * Get all available themes
 */
export const getAllThemes = async () => {
  return prisma.theme.findMany({
    orderBy: { name: 'asc' }
  });
};

/**
 * Create a new theme
 */
export const createTheme = async (theme: {
  name: string;
  description?: string;
  githubRepoUrl?: string;
  previewUrl?: string;
}) => {
  return prisma.theme.create({
    data: theme
  });
};

/**
 * Get a theme by name
 */
export const getThemeByName = async (name: string) => {
  return prisma.theme.findUnique({
    where: { name }
  });
};

/**
 * Initialize default theme if it doesn't exist
 */
export const initializeDefaultTheme = async () => {
  const defaultExists = await validateTheme('default');
  
  if (!defaultExists) {
    await createTheme({
      name: 'default',
      description: 'Default CV Wonder theme',
      githubRepoUrl: 'https://github.com/cvwonder/default-theme',
      previewUrl: 'https://cvwonder.com/themes/default/preview'
    });
    console.log('Default theme initialized');
  }
};