#!/usr/bin/env node
/**
 * This script will deploy database migrations using Prisma
 * It should be run whenever the database schema changes
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

console.log(`${colors.fg.cyan}${colors.bright}=== CV Wonder Database Migration ===${colors.reset}`);
console.log(`${colors.fg.yellow}Running database migrations${colors.reset}`);

try {
  // Create the migration
  console.log(`\n${colors.fg.blue}Creating migration...${colors.reset}`);
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  
  // Deploy the migration
  console.log(`\n${colors.fg.blue}Deploying migration...${colors.reset}`);
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Generate Prisma client
  console.log(`\n${colors.fg.blue}Generating Prisma client...${colors.reset}`);
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log(`\n${colors.fg.green}${colors.bright}Migration completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.fg.red}${colors.bright}Migration failed:${colors.reset}`, error.message);
  process.exit(1);
}