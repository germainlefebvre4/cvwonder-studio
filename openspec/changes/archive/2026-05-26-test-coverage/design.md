## Context

The backend follows hexagonal architecture (domain → ports → usecases → adapters). All external dependencies are hidden behind Go interfaces (`ports.SessionRepository`, `ports.ThemeRepository`, `ports.Generator`). This means usecases can be tested entirely with in-memory fakes — no mocking library needed.

Current state:
- `internal/userauth/token_test.go` — 6 tests, all passing
- `internal/usecases/session/create_test.go` — broken (duplicate `package` declaration on line 1)
- Frontend: no test runner, no test files

The frontend is a Vite + React 19 + TypeScript project with Zustand stores and custom hooks. No test infrastructure exists.

## Goals / Non-Goals

**Goals:**
- All Go usecases covered by unit tests using fake implementations of port interfaces
- Domain methods (`IsExpired`, `IsOwner`) covered by table-driven tests
- Repository adapters covered by integration tests against a real Postgres container
- Frontend test infrastructure installed and configured
- Frontend pure logic (utils, stores, hooks) covered by Vitest tests
- Light component smoke tests for critical UI paths
- Makefile targets for running each layer independently

**Non-Goals:**
- End-to-end browser tests (Playwright / Cypress) — separate concern, separate change
- 100% line coverage enforcement — coverage gates are aspirational, not enforced in CI initially
- Testing the `admin` package HTTP handlers (high coupling to gin, low ROI vs complexity)
- Testing the `BinaryAdapter` directly (requires the `cvwonder` binary on PATH — tested indirectly through integration)

## Decisions

### D1: testcontainers-go for integration tests (vs relying on `docker-compose.yml`)

**Chosen**: testcontainers-go

**Rationale**: Self-contained — no external `docker compose up` step before `go test`. Tests manage their own lifecycle: spin up a postgres container, run migrations, execute tests, tear down. Parallel-safe (random port assigned). Works in any CI with a Docker daemon.

**Alternative considered**: Connect to the existing `docker-compose.yml` postgres via `DATABASE_URL` env var. Simpler, but creates test/dev state pollution and requires the developer to run compose before tests. Fragile in CI.

**Trade-off**: Adds a transitive dependency tree (~10 modules) but only pulled in under the `integration` build tag — production binary is unaffected.

### D2: Build tag `integration` to gate integration tests

Integration tests are excluded from the default `go test ./...` run:
```go
//go:build integration
```
Run explicitly with `go test -tags=integration ./...`. This keeps the default test run fast and dependency-free.

### D3: Shared fakes in `internal/testhelpers/` (vs per-package fakes)

**Chosen**: Shared `internal/testhelpers/` package

**Rationale**: `fakeSessionRepo`, `fakeThemeRepo`, `fakeGenerator` are needed by multiple test packages (session, preview, validation, theme). Duplicating them per-package creates drift. A shared package makes fakes a first-class artifact.

**Alternative considered**: Each package defines its own minimal fake. Avoids the shared package but each fake must implement the full interface — boilerplate grows.

### D4: Vitest over Jest for frontend

**Chosen**: Vitest

**Rationale**: Native Vite integration — no separate config, imports resolve the same way as production code (path aliases like `@/` work out of the box). Fast (esbuild-backed). First-class TypeScript support.

**Alternative considered**: Jest with `ts-jest`. Requires separate module resolution config and a Babel/SWC transform step. More moving parts for the same result.

### D5: msw v2 for frontend API mocking

Mock Service Worker intercepts `fetch` at the network layer via a service worker in browsers (or Node.js handlers in tests). Services in `src/services/*.ts` make plain `fetch` calls — msw handlers can replace them entirely without modifying production code.

### D6: Fake Generator for preview usecase tests (not temp binary)

`ExecuteForSession` calls `ports.Generator.GenerateHTML`. In unit tests, a `fakeGenerator` satisfies the interface and creates a minimal `index.html` in `outputDir`. The `outputDir` itself is a real temp directory created with `os.MkdirTemp` — this tests the file I/O path without invoking the cvwonder binary.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| testcontainers-go pulls Docker image on first run — slow CI cold start | Pin the postgres image tag (`postgres:16-alpine`), leverage Docker layer cache in CI |
| Fake implementations diverge from real ones over time | Keep fakes minimal — implement only what the interface requires, fail loudly on unexpected calls |
| Frontend tests coupled to implementation details (querying by class names) | Use `@testing-library` queries by role/text — resilient to style changes |
| msw handlers mask real API shape changes | Validate msw handlers against actual backend response shapes in integration tests |

## Migration Plan

1. Fix the broken `create_test.go` — immediate, no risk
2. Add domain and usecase tests — additive, no production code touched
3. Add `testhelpers` package — additive
4. Add integration tests with `//go:build integration` tag — additive
5. Install frontend devDependencies — no production bundle impact (devDependencies only)
6. Add `vitest.config.ts` and test files — additive
7. Update Makefile with new targets

Rollback: all changes are additive test files and devDependencies. Nothing to roll back.
