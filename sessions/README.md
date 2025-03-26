# CV Wonder Sessions System

This folder contains CV session data, with each session stored in its own directory using a unique hash ID.

## Session Structure

Each session is stored in a directory named with a unique hash ID and contains:

- `metadata.json`: Contains session metadata including creation date, last update, selected theme
- `cv.yml`: The actual YAML content of the CV

## Creating a New Session

Sessions can be created in three ways:

1. **From the Web Interface**: Click the "Create Session" button on the homepage
2. **Using the API**: Send a POST request to `/api/sessions`
3. **Using the test script**: Run `node scripts/create-test-session.js`

## Accessing a Session

Sessions can be accessed via URL with the pattern:
```
/session/[sessionId]
```

For example:
```
/session/526c4f49dbf73ab679bf4ec9d9020188
```

## Session Persistence

Sessions are stored on the server file system and are persistent across server restarts.
Multiple users can work on different sessions simultaneously.

## Features

- Real-time preview generation
- PDF download
- Session sharing via URL
- Auto-save as you type
- Theme selection
