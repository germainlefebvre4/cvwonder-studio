---
name: backend-context
description: Load Go backend specs and active changes before implementing backend features. Use when working on Go code, API routes, database, auth, or domain logic.
license: MIT
metadata:
  author: cvwonder-studio
  version: "1.0"
---

Load backend capability specs and active change context before implementing.

**Use this skill when working on:**
- Go backend code (`backend/`)
- Gin API handlers (`backend/internal/adapters/http/`)
- Usecases and domain models (`backend/internal/usecases/`, `backend/internal/domain/`)
- Database queries and migrations (`backend/db/`)
- Authentication / OAuth (`backend/internal/userauth/`)
- External adapters (CVWonder, Gotenberg…)
- Backend unit or integration tests

---

## Specs

Read each spec below before implementing. Specs use `WHEN / THEN` BDD scenarios that define the expected behavior.

- openspec/specs/go-api-server/spec.md
- openspec/specs/user-auth/spec.md
- openspec/specs/user-sessions/spec.md
- openspec/specs/cvwonder-adapter/spec.md
- openspec/specs/anonymous-protections/spec.md
- openspec/specs/backend-unit-tests/spec.md
- openspec/specs/backend-integration-tests/spec.md

**Steps**

1. **Read all specs listed above** using the file reading tool.

2. **Check for active backend-related changes**
   ```bash
   ls openspec/changes/
   ```
   For each non-`archive` directory, check if its `proposal.md` touches backend capabilities:
   ```bash
   cat openspec/changes/<name>/proposal.md
   cat openspec/changes/<name>/tasks.md
   ```
   Read the artifacts of any relevant active change.

3. **Summarize context loaded**

   Output a brief summary:
   ```
   ## Backend Context Loaded

   Specs read: go-api-server, user-auth, user-sessions, cvwonder-adapter,
               anonymous-protections, backend-unit-tests, backend-integration-tests

   Active changes touching backend:
   - <change-name>: <one-line summary from proposal>

   Ready to implement.
   ```

**Key conventions (from specs)**
- All API routes are versioned under `/api/v1/`
- Tokens are stored as SHA-256 hashes; the raw token is returned only once at creation
- Session creation MUST link `user_id` when the user is authenticated (`userauth.GetUserID`)
- Anonymous sessions: 24h TTL, 1 per browser, progressive expiry warnings
- Rate limiting: 100 req/min per IP via `golang.org/x/time/rate`
- Never edit `backend/db/generated/` — run `make sqlc-gen` after changing SQL
