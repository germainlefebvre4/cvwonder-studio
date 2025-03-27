#!/usr/bin/env node

const { cleanupExpiredBlobSessions, getEnvironmentName } = require('../lib/sessions');

async function main() {
  try {
    // Get command line args
    const args = process.argv.slice(2);
    let env = null;
    
    // Check if an environment was specified
    if (args.length > 0) {
      env = args[0];
      console.log(`Starting cleanup of expired sessions in ${env} environment...`);
    } else {
      console.log(`Starting cleanup of expired sessions in current environment (${getEnvironmentName()})...`);
    }
    
    // Run the cleanup
    await cleanupExpiredBlobSessions(env);
    
    console.log('Blob storage cleanup completed successfully');
  } catch (error) {
    console.error('Error during blob storage cleanup:', error);
    process.exit(1);
  }
}

main();