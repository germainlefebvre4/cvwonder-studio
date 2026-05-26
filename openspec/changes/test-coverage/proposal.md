## Why

The codebase has near-zero automated test coverage: one partially broken Go test file and no frontend tests whatsoever. With multiple complex features landed (OAuth, anonymous sessions, quota management, session sharing, starter templates), there is no safety net for regressions. A systematic test suite is needed to give confidence before each release and as a foundation for future development.

## What Changes

- Fix the broken `session/create_test.go` (duplicate `package` declaration causing compile failure)
- Add Go unit tests for the domain layer (`Session.IsExpired`, `Session.IsOwner`)
- Add Go unit tests for all usecases using in-memory fakes (session get/update, preview generate, validation, theme list/sync)
- Add Go unit tests for infrastructure packages that do not need a DB (userauth middleware, templates catalog, HTTP middleware)
- Add Go integration tests for the repository adapters against a real Postgres instance using `testcontainers-go` (gated by `//go:build integration`)
- Set up Vitest + Testing Library + msw in the frontend (zero test infrastructure today)
- Add frontend tests for pure utils, Zustand stores, custom hooks, and key components
- Add `test`, `test-int`, `test-frontend`, and `test-ci` Makefile targets

## Capabilities

### New Capabilities

- `backend-unit-tests`: Go unit tests for domain, usecases, userauth middleware, templates, and HTTP middleware — all in-memory, no external dependencies
- `backend-integration-tests`: Go integration tests for `adapters/repository/*` against a real Postgres container via `testcontainers-go`, gated by build tag `integration`
- `frontend-test-infra`: Vitest + @testing-library/react + msw v2 + jsdom setup in the frontend project
- `frontend-unit-tests`: Tests for `src/lib/utils.ts`, Zustand stores, custom hooks, and light component smoke tests

### Modified Capabilities

<!-- No existing spec-level requirements change — this is purely additive infrastructure -->

## Impact

- **Backend**: new `_test.go` files throughout `internal/`; new `go.sum` entries for `testcontainers-go` and its transitive deps (integration build only)
- **Frontend**: new devDependencies (`vitest`, `@testing-library/react`, `@testing-library/user-event`, `msw`, `jsdom`); new `vitest.config.ts`; new `*.test.ts(x)` files
- **CI**: new Makefile targets; integration tests require Docker daemon
- **No production code changes** — test-only additions except the one `create_test.go` bug fix
