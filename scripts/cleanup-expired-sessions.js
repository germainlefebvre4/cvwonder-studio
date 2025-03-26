#!/usr/bin/env node

const { cleanupExpiredSessions } = require('../lib/sessions');

async function main() {
  try {
    console.log('Starting cleanup of expired sessions...');
    await cleanupExpiredSessions();
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main();