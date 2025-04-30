---
hide:
  - toc
---
# Configuration

This guide explains how to configure CVWonder to customize its behavior and output.

## Environment Variables

Some configuration options can also be set using environment variables. This allows you to override the default settings without modifying the configuration file.

| Environment Variable | Description | Example |
|----------------------|-------------|----------------|
| `APP_ENV` | Application environment (e.g., `development`, `production`). | `development`, `production` |
| `DATABASE_URL` | URL for the database connection. | `postgresql://user:password@host:port/dbname?schema=public` |
| `LOG_LEVEL` | Logging level (e.g., `debug`, `info`, `warning`, `error`). | `debug`, `info`, `warning`, `error` |
| `CVWONDER_VERSION` | Version of the CVWonder binary to download on startup. | `0.3.0` |
| `CVWONDER_PDF_GENERATION_PORT` | Port for PDF generation service. | `9889` |

## Next Steps

Now that you understand how to configure CVWonder, check out:

- [CV structure](https://cvwonder.readthedocs.io/en/latest/getting-started/write-cv/)
- [YAML format](../user-guide/yaml-format.md) to learn about the structure of CV files
