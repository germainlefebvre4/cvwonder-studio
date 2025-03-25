#!/usr/bin/env node

// This script manually creates a new session for testing purposes

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a random session ID (hash)
const sessionId = crypto.randomBytes(16).toString('hex');
console.log(`Creating new session with ID: ${sessionId}`);

// Create the session directory
const sessionDir = path.join(__dirname, '..', 'sessions', sessionId);
fs.mkdirSync(sessionDir, { recursive: true });

// Create the session metadata
const now = new Date();
const metadata = {
  id: sessionId,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  cvContent: `---
company:
  name: Example Company
  logo: images/company-logo.webp

person:
  name: John Doe
  depiction: profile.png
  profession: Software Engineer
  location: New York
  citizenship: US
  email: john.doe@example.com
  site: http://johndoe.example.com
  phone: +1 123-456-7890

socialNetworks:
  github: johndoe
  stackoverflow: johndoe
  linkedin: johndoe
  twitter: johndoe

abstract:
  - tr: "Experienced software engineer with a passion for building scalable applications."
  - tr: "Specialized in cloud-native architectures and modern development practices."

career:
  - companyName: Example Tech
    companyLogo: images/example-logo.webp
    duration: 3 years
    missions:
      - position: Senior Software Engineer
        company: Example Tech
        location: New York, USA
        dates: 2022 - Present
        summary: Working on cloud-native applications.
        technologies:
          - TypeScript
          - React
          - Node.js
          - AWS
        description:
          - Developed and maintained microservices
          - Implemented CI/CD pipelines
          - Optimized application performance

languages:
  - name: English
    level: Native
  - name: Spanish
    level: Intermediate

education:
  - schoolName: University of Technology
    degree: Bachelor of Computer Science
    location: Boston, USA
    dates: 2014 - 2018`,
  selectedTheme: "default"
};

// Write metadata to file
fs.writeFileSync(
  path.join(sessionDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2)
);

// Write CV content to file
fs.writeFileSync(
  path.join(sessionDir, 'cv.yml'),
  metadata.cvContent
);

console.log(`Session created successfully at: ${sessionDir}`);
console.log(`Access the session at: http://localhost:3000/session/${sessionId}`);