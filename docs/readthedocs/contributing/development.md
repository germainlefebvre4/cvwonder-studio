# Development Setup

This guide provides detailed instructions for setting up a development environment for CVWonder.

## Prerequisites

Before setting up the development environment, ensure you have the following prerequisites installed:

- Go 1.22 or higher
- Python 3.7 or higher (pre-commit hooks)

## Setting Up the Development Environment

### Clone the Repository

First, fork the CVWonder repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/cvwonder-studio.git
cd cvwonder-studio/
```

Add the upstream repository as a remote:

```bash
git remote add upstream https://github.com/germainlefebvre4/cvwonder-studio.git
```

### Install Development Dependencies

### Install Pre-commit Hooks

CVWonder uses pre-commit hooks to ensure code quality:

```bash
pre-commit install
```

This will automatically run linters and formatters before each commit.

## Development Tools

### Code Formatting

### Linting

### Type Checking

### Testing

## Project Structure

The direcotry structure of CVWonder Studio is explained in the [Architecture - Directory Structure](architecture.md#directory-structure) section.

## Building Documentation

The documentation is built using [MkDocs](https://www.mkdocs.org/) and [MkDocs Material](https://squidfunk.github.io/mkdocs-material/):

```bash
# Install documentation dependencies
make doc-install

# Serve documentation locally
make doc-serve
```

This will start a local server at http://127.0.0.1:8000/ where you can preview the documentation.

## Common Development Tasks

## Debugging Tips

### Using the Debugger

If you're using VS Code, a launch configuration is provided in `.vscode/launch.json` for debugging.

### Logging

CVWonder uses [Logrus](https://github.com/sirupsen/logrus) for logging.

## Continuous Integration

CVWonder uses [GitHub Actions](https://docs.github.com/en/actions) for continuous integration:

- Tests are run on every push and pull request
- Code formatting and linting are checked
- Documentation is built to ensure it compiles correctly

Make sure your code passes all CI checks before submitting a pull request.

## Next Steps

- Read the [Contributing Guide](issues.md) for information on the development process
- Explore the [Architecture](architecture.md) to understand how CVWonder works
