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
    name: 'Default',
    slug: 'default',
    description: 'Default theme for CV Wonder',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-default',
    previewUrl: 'https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-default/main/preview.png'
  },
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Basic theme for CV Wonder',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-basic',
    previewUrl: 'https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-basic/main/preview.png'
  },
  {
    name: 'Horizon Timeline',
    slug: 'horizon-timeline',
    description: 'Horizon Timeline theme for CV Wonder',
    githubRepoUrl: 'https://github.com/germainlefebvre4/cvwonder-theme-horizon-timeline',
    previewUrl: 'https://raw.githubusercontent.com/germainlefebvre4/cvwonder-theme-horizon-timeline/main/preview.png'
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
        where: { slug: theme.slug }
      });
      
      if (existingTheme) {
        console.log(`${colors.fg.yellow}Theme '${theme.slug}' already exists, updating...${colors.reset}`);
        
        await prisma.theme.update({
          where: { slug: theme.slug },
          data: theme
        });
      } else {
        console.log(`${colors.fg.green}Creating theme '${theme.slug}'...${colors.reset}`);
        
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