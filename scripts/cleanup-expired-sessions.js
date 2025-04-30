#!/usr/bin/env node
/**
 * This script cleans up expired sessions from the database
 * It can be scheduled to run periodically (e.g., daily)
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

async function cleanupExpiredSessions() {
  console.log(`${colors.fg.cyan}${colors.bright}=== CV Wonder Session Cleanup ===${colors.reset}`);
  
  try {
    const now = new Date();
    
    console.log(`${colors.fg.blue}Finding expired sessions...${colors.reset}`);
    
    // Find all expired sessions
    const expiredSessions = await prisma.session.findMany({
      where: {
        expiresAt: {
          lt: now
        }
      },
      select: {
        id: true,
        expiresAt: true
      }
    });
    
    if (expiredSessions.length === 0) {
      console.log(`${colors.fg.green}No expired sessions found.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.fg.yellow}Found ${expiredSessions.length} expired sessions to delete.${colors.reset}`);
    
    // Delete all expired sessions
    const deletedCount = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    console.log(`${colors.fg.green}${colors.bright}Successfully deleted ${deletedCount.count} expired sessions.${colors.reset}`);
    
    // Log session IDs for debugging
    if (process.env.DEBUG) {
      console.log('Deleted session IDs:');
      expiredSessions.forEach(session => {
        console.log(`- ${session.id} (expired: ${session.expiresAt.toISOString()})`);
      });
    }
  } catch (error) {
    console.error(`${colors.fg.red}${colors.bright}Session cleanup failed:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupExpiredSessions();