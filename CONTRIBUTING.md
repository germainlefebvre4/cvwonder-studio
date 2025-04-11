# Contributing

This page contains information on how to contribute to the CV Wonder project. It includes instructions for setting up the development environment, running tests, and contributing code.

## CV Wonder Studio

Coming soon!

## Documentation

To run the documentation, it is expected to have the following dependencies installed:

- [Pyenv](https://github.com/pyenv/pyenv)

or

- [Python 3.11+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/docs/#installation)

The documentation is built using [MkDocs](https://www.mkdocs.org/) and [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

> Note: The commands are run using *pyenv*. But you can use any Python version manager or install Python directly. Just make sure to have the correct version of Python installed.

### Install dependencies

```bash
# Load the .python-version file
pyenv local
# OR Load the Python version directly
pyenv local 3.11
```

```bash
poetry env use $(pyenv local)
make doc-install
```

### Run the documentation

```bash
make doc-serve
```

This will start a local server at `http://localhost:8000` with the documentation. You can open this URL in your browser to view the documentation.
