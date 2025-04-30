import prisma from './db';
import { logger } from './logger';

// All theme-related functionality

/**
 * Validate if a theme exists in the database
 */
export const validateTheme = async (themeSlug: string = 'default'): Promise<boolean> => {
  try {
    const theme = await prisma.theme.findUnique({
      where: { slug: themeSlug }
    });
    return !!theme;
  } catch (error) {
    logger.error(`Error validating theme ${themeSlug}:`, error);
    return false;
  }
};

/**
 * Get all available themes
 */
export const getAllThemes = async () => {
  return prisma.theme.findMany({
    orderBy: { slug: 'asc' }
  });
};

/**
 * Create a new theme
 */
export const createTheme = async (theme: {
  name: string;
  slug: string;
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
export const getThemeByName = async (slug: string) => {
  return prisma.theme.findUnique({
    where: { slug }
  });
};

/**
 * Initialize default theme if it doesn't exist
 */
export const initializeDefaultTheme = async () => {
  const defaultExists = await validateTheme('default');
  
  if (!defaultExists) {
    await createTheme({
      name: 'Default',
      slug: 'default',
      description: 'Default theme for CV Wonder',
      githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-default',
      previewUrl: 'https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/main/preview.png'
    });
    logger.info('Default theme initialized');
  }
};