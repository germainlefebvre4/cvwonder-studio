# CV Wonder Studio

## Getting Started

CV Wonder Studio is a web application that allows users to generate and manage CVs (Curriculum Vitae) using the CVWonder binary. This project is built with Node.js and Express.
It provides a RESTful API for generating CVs in PDF format and managing user data.

### Prerequisites

Before you begin, ensure you have the following installed on your machine.

- Node.js: v22
  - pnpm (v10)

Start the database server and create a database named `cvwonder`.

```bash
docker compose up -d
```

### Start the Studio

To start the CV Wonder Studio, run the following command:

```bash
pnpm install
pnpm run db:init
pnpm dev
```

This will start the application in development mode. The server will be available at `http://localhost:3000`.

## Environment Variables

The application uses environment variables to configure some behavior. You can set these variables in a `.env` file in the root directory of the project.

```env
CVWONDER_VERSION=latest
CVWONDER_PDF_GENERATION_PORT=3000
APP_ENV=development
LOG_LEVEL=info
```

The following environment variables are available:

| Environment Variable | Description | Default |
| -------- | ----------- | ------- |
| `CVWONDER_VERSION` | Version of the CVWonder binary to download. Can be a specific version (e.g., `v0.3.0`) | `0.3.0` |
| `CVWONDER_PDF_GENERATION_PORT` | Port for the PDF generation service. **Must be different** from the application port `3000`. | `9889` |
| `APP_ENV` | Environment of the application. Can be `development`, `staging`, or `production`. | `development` |
| `LOG_LEVEL` | Log level for the application. Can be `info`, `warn`, or `error`. | `info` |

## Deployment

### Production

A Docker Compose file is provided for deploying the application in production. You can build and run the application using Docker Compose.

```bash
docker compose -f docker-compose.prod.yml up -d
```

This will build the application and start the server in production mode. The server will be available at `http://localhost:3000`.

The production environment is the minimum viable to go to production. It is composed of the following services (and name in Docker Compose):

| Component | Docker Compose name | Description |
| --------- | ------------------ | ----------- |
| Nginx | `nginx` | The reverse proxy server with rate limiting |
| CV Wonder Studio | `web` | The main application server |
| PostgreSQL | `database` | The database server |

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue on GitHub. If you want to contribute code, please fork the repository and submit a pull request.

You can see the [contribution guidelines](CONTRIBUTING.md) for more information on how to contribute to the project.

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](https://opensource.org/license/apache-2-0) file for details. You can also find the details of the license on the [Open Source Initiative](https://opensource.org/licenses/Apache-2.0).

```License
   Copyright 2025 Germain LEFEBVRE

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
