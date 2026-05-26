## 1. Immediate Fix

- [ ] 1.1 Delete the stray `package session` line 1 from `backend/internal/usecases/session/create_test.go`
- [ ] 1.2 Run `go test ./...` in `backend/` and confirm all existing tests pass

## 2. Shared Test Helpers (Backend)

- [ ] 2.1 Create `backend/internal/testhelpers/fakes.go` with `FakeSessionRepo` implementing `ports.SessionRepository`
- [ ] 2.2 Add `FakeThemeRepo` implementing `ports.ThemeRepository` to `testhelpers/fakes.go`
- [ ] 2.3 Add `FakeGenerator` implementing `ports.Generator` to `testhelpers/fakes.go`
- [ ] 2.4 Verify all three fakes compile by running `go build ./internal/testhelpers/`

## 3. Domain Layer Tests

- [ ] 3.1 Create `backend/internal/domain/session_test.go` with table-driven tests for `IsExpired` (before/at/after expiry)
- [ ] 3.2 Add table-driven tests for `IsOwner` (matching UUID, non-matching UUID, nil UserID)

## 4. Usecase Layer Tests

- [ ] 4.1 Create `backend/internal/usecases/session/get_test.go`: token hash correctness, not-found, expired-deletes, valid-returned
- [ ] 4.2 Create `backend/internal/usecases/session/update_test.go`: nil ThemeID skips validation, valid ThemeID succeeds, unknown ThemeID errors
- [ ] 4.3 Create `backend/internal/usecases/preview/generate_test.go`: nil themeID, theme not found, empty LocalPath, bad disk path, happy path with `os.MkdirTemp`
- [ ] 4.4 Create `backend/internal/usecases/validation/validate_test.go`: valid YAML, invalid YAML, generator error
- [ ] 4.5 Create `backend/internal/usecases/theme/list_test.go`: returns themes from repo, repo error propagated
- [ ] 4.6 Create `backend/internal/usecases/theme/sync_builtin_test.go`: non-existent dir silently ignored, temp dir with subdirs triggers upserts

## 5. Infrastructure Layer Tests (No DB)

- [ ] 5.1 Create `backend/internal/templates/catalog_test.go`: `GetCatalog` non-empty, `GetContent` known slug, `GetContent` unknown slug
- [ ] 5.2 Create `backend/internal/userauth/middleware_test.go`: valid cookie sets user ID, invalid cookie ignored, missing cookie passes through, `RequireUser` blocks 401, `RequireUser` allows 200

## 6. Backend Integration Tests

- [ ] 6.1 Add `testcontainers-go` to `backend/go.mod` under a `//go:build integration` guarded file
- [ ] 6.2 Create `backend/internal/adapters/repository/testmain_integration_test.go` with `TestMain` that spins up `postgres:16-alpine`, runs all migrations, and tears down
- [ ] 6.3 Create `backend/internal/adapters/repository/session_integration_test.go`: Insert+GetByTokenHash, GetByTokenHash unknown, Update, Delete, DeleteExpired
- [ ] 6.4 Create `backend/internal/adapters/repository/theme_integration_test.go`: Upsert new, Upsert update, ListActive excludes deleted, GetByID found, GetByID not found
- [ ] 6.5 Run `go test -tags=integration ./internal/adapters/repository/...` and confirm all pass

## 7. Makefile Targets

- [ ] 7.1 Add `test` target to root `Makefile`: `cd backend && go test ./...`
- [ ] 7.2 Add `test-int` target: `cd backend && go test -tags=integration ./...`
- [ ] 7.3 Add `test-frontend` target: `cd frontend && pnpm vitest run`
- [ ] 7.4 Add `test-ci` target that calls `test` then `test-frontend` (integration tests opt-in separately)

## 8. Frontend Test Infrastructure

- [ ] 8.1 Install devDependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`, `jsdom`
- [ ] 8.2 Create `frontend/vitest.config.ts` with jsdom environment, `@/` alias resolution, and `setupFilesAfterFramework: ['./src/test-setup.ts']`
- [ ] 8.3 Create `frontend/src/test-setup.ts` importing `@testing-library/jest-dom`
- [ ] 8.4 Create `frontend/src/mocks/handlers.ts` with msw request handlers for `/api/validate`, `/api/generate`, `/api/sessions`, `/api/user`
- [ ] 8.5 Create `frontend/src/mocks/server.ts` setting up the msw Node.js server
- [ ] 8.6 Update `test-setup.ts` to start/reset/stop the msw server around the suite
- [ ] 8.7 Add `"test": "vitest run"` and `"test:watch": "vitest"` to `frontend/package.json` scripts
- [ ] 8.8 Run `pnpm vitest run` with no test files and confirm exit 0

## 9. Frontend Pure Logic Tests

- [ ] 9.1 Create `frontend/src/lib/utils.test.ts` covering all exported functions in `utils.ts`
- [ ] 9.2 Create `frontend/src/hooks/useDebounce.test.ts`: value updates after delay, does not update before delay (fake timers)
- [ ] 9.3 Create `frontend/src/store/user.test.ts`: initial state, `setUser` updates, `setUser(null)` clears
- [ ] 9.4 Create `frontend/src/store/studio.test.ts`: initial state, YAML content setter

## 10. Frontend Hook Tests (with msw)

- [ ] 10.1 Create `frontend/src/hooks/useValidation.test.ts`: valid YAML returns no errors, invalid YAML surfaces errors, API failure handled gracefully
- [ ] 10.2 Create `frontend/src/hooks/usePreview.test.ts`: successful generation updates previewUrl, generation error surfaces in error state

## 11. Frontend Component Tests

- [ ] 11.1 Create `frontend/src/pages/user/Dashboard.test.tsx`: quota bar at 100% shows error style and full-quota message, new-session link hidden when full, visible when under quota
- [ ] 11.2 Create `frontend/src/pages/user/Login.test.tsx`: anon token included in login URL when present, plain login URL when absent, authenticated user redirected

## 12. Final Verification

- [ ] 12.1 Run `make test` — all Go unit tests pass
- [ ] 12.2 Run `make test-int` — all integration tests pass (Docker daemon required)
- [ ] 12.3 Run `make test-frontend` — all frontend tests pass
- [ ] 12.4 Review overall coverage and document any intentionally untested packages
