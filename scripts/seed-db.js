#!/usr/bin/env node
/**
 * This script seeds the database with initial theme data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
  }
};

// Initial themes to seed
const themes = [
  {
    name: 'default',
    description: 'Default CV Wonder theme',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-default',
    previewUrl: 'https://cvwonder.com/themes/default/preview'
  },
  {
    name: 'modern',
    description: 'Modern and clean CV theme with sleek design',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-modern',
    previewUrl: 'https://cvwonder.com/themes/modern/preview'
  },
  {
    name: 'professional',
    description: 'Professional CV theme for corporate environments',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-professional',
    previewUrl: 'https://cvwonder.com/themes/professional/preview'
  }
];

async function main() {
  console.log(`${colors.fg.cyan}${colors.bright}=== CV Wonder Database Seeding ===${colors.reset}`);
  
  try {
    console.log(`${colors.fg.blue}Seeding themes...${colors.reset}`);
    
    // Create each theme
    for (const theme of themes) {
      // Check if theme already exists
      const existingTheme = await prisma.theme.findUnique({
        where: { name: theme.name }
      });
      
      if (existingTheme) {
        console.log(`${colors.fg.yellow}Theme '${theme.name}' already exists, updating...${colors.reset}`);
        
        await prisma.theme.update({
          where: { name: theme.name },
          data: theme
        });
      } else {
        console.log(`${colors.fg.green}Creating theme '${theme.name}'...${colors.reset}`);
        
        await prisma.theme.create({
          data: theme
        });
      }
    }
    
    console.log(`${colors.fg.green}${colors.bright}Database seeding completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.fg.red}${colors.bright}Database seeding failed:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();