# Architecture

This document provides an overview of CVWonder Studio's architecture for developers interested in understanding or contributing to the project.

## System Overview

CVWonder Studio is designed to help you create beautiful CVs in a graphical way.

```
YAML Editor → Parser → Storage Manager → Theme Engine → Renderer
```

This design allows for:

- Clear separation of concerns
- Extensibility at each step of the process
- Support for multiple input and output formats
- Custom templates and renderers

## Core Components

### YAML Editor

The YAML Editor is the main interface for users to input their CV data. It provides:

- Syntax highlighting and error checking
- Auto-completion for YAML keys

### Parser

The Parser module reads input files (primarily YAML) and converts them into the internal data model and ensures input data adheres to the expected schema. It's responsible for:

- Reading and validating input files
- Converting external formats to the internal data model
- Providing helpful error messages for invalid inputs
- Handling different input formats (YAML, JSON, etc.)
- JSON Schema Validation
- Type checking for various fields
- Custom validation rules for specific fields
- Error reporting for invalid data

### Storage Manager

The Storage Manager handles the storage of CV data. It is responsible for:

- Storing CV data in a database
- Generating a unique session ID for each CV
- Managing sessions for user data

### Theme Engine

The Theme Engine applies templates to the data model:

- Manages theme loading and caching
- Handles theme inheritance and includes
- Processes theme variables and logic

### Renderer

The Renderer converts the templated output into final formats:

- Supports multiple output formats (PDF, etc.)
- Handles format-specific optimizations
- Manages assets like images, fonts, etc.

## Directory Structure

```
cvwonder/
├── app/                   # Main application logic
├── bin/                   # CV Wonder CLI (expected name: cvwonder)
├── components/            # Core components (parser, renderer, etc.)
├── hooks/                 # Hooks for custom actions
├── lib/                   # Utility libraries
├── prisma/                # Prisma ORM for database interactions
├── public/                # Public assets (images, fonts, etc.)
├── scripts/               # Scripts for data generation
└── themes/                # Built-in themes (useful to start quickly)
```

## Data Flow

1. **Input Processing**: 
   - Parser reads and validates the YAML content
   - JSON Schema Validation is performed on the content
   - ORM stores the YAML content in the database

2. **Template Processing**:
   - Template Engine uses the themes seleted in the configuration (dropdown menu) 
   - Template applies the selected theme to the CV content based on the CV Wonder binary
   - Renderer generates the HTML render in the directory `sessions/<session_id>` and file `cv.html`

3. **Output Generation**:
   - Generated content is exposed to the user via the web interface
   - Assets are exposed via a dedicated route

## Testing Architecture

Coming soon.

## Performance Considerations

Coming soon.

## Security Considerations

CVWonder Studio implements various security measures:

- Input validation to prevent injection attacks
- Sandboxed template rendering
- Safe handling of user-provided assets
- Proper error handling to avoid information leakage

## Next Steps

- Learn about [contributing to CVWonder Studio](issues.md)
- Set up your [development environment](development.md)
