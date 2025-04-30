#!/usr/bin/env node

// This script lists all available sessions

const fs = require('fs');
const path = require('path');

// Get sessions directory
const sessionsDir = path.join(__dirname, '..', 'sessions');

// Read all session directories
const sessionDirs = fs.readdirSync(sessionsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && dirent.name !== 'node_modules' && !dirent.name.startsWith('.') && dirent.name !== 'README.md')
  .map(dirent => dirent.name);

console.log(`Found ${sessionDirs.length} session(s):`);

// Display session details
sessionDirs.forEach(sessionId => {
  try {
    const metadataPath = path.join(sessionsDir, sessionId, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const created = new Date(metadata.createdAt).toLocaleString();
      const updated = new Date(metadata.updatedAt).toLocaleString();
      
      // Extract person name from YAML if possible
      let personName = 'Unknown';
      try {
        const cvContent = metadata.cvContent;
        const personMatch = cvContent.match(/person:\s*\n\s*name:\s*(.*)/);
        if (personMatch && personMatch[1]) {
          personName = personMatch[1].trim();
        }
      } catch (e) {
        // Ignore parsing errors
      }

      console.log(`- Session ID: ${sessionId}`);
      console.log(`  Person: ${personName}`);
      console.log(`  Theme: ${metadata.selectedTheme}`);
      console.log(`  Created: ${created}`);
      console.log(`  Last Updated: ${updated}`);
      console.log(`  URL: http://localhost:3000/session/${sessionId}`);
      console.log();
    }
  } catch (error) {
    console.error(`Error reading session ${sessionId}:`, error.message);
  }
});