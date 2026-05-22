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
docker compose up database -d
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

The application is configured entirely via environment variables. Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

### Application

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `PORT` | HTTP server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `CVWONDER_BINARY_PATH` | Path to the `cvwonder` binary | `/usr/local/bin/cvwonder` |
| `SESSIONS_BASE_DIR` | Directory for session files | `/data/sessions` |
| `SESSION_DURATION_DAYS` | How long sessions remain valid | `30` |
| `THEMES_BUILTIN_DIR` | Directory for built-in themes | `/app/themes` |
| `THEMES_RUNTIME_DIR` | Directory for user-installed themes | `/data/themes` |

### Admin

The admin section (`/admin`) requires three additional variables that **must** be set — the application will refuse to start without them.

| Variable | Description |
| -------- | ----------- |
| `ADMIN_USERNAME` | Login username for the admin interface |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password (cost factor ≥ 12) |
| `ADMIN_TOKEN_SECRET` | Random secret used to sign admin session tokens (32+ chars) |

**Generating a password hash:**

```bash
# Using htpasswd (apache2-utils)
htpasswd -bnBC 12 "" yourpassword | tr -d ':\n' | sed 's/$2y/$2a/'

# Using Python
python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt(12)).decode())"
```

**Generating a token secret:**

```bash
openssl rand -hex 32
```

## Deployment

### Production

A Docker Compose file is provided for deploying the application in production. You can build and run the application using Docker Compose.

```bash
cd examples/
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
