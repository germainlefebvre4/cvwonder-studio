## ADDED Requirements

### Requirement: Fix broken session create test
The test file `internal/usecases/session/create_test.go` SHALL compile and pass without errors. The duplicate `package session` declaration on line 1 SHALL be removed.

#### Scenario: Default go test run passes
- **WHEN** `go test ./...` is run in `backend/`
- **THEN** all packages compile and all tests pass with exit code 0

---

### Requirement: Domain session methods are tested
The `Session.IsExpired()` and `Session.IsOwner()` methods SHALL be covered by table-driven unit tests in `internal/domain/session_test.go`.

#### Scenario: IsExpired returns false before expiry
- **WHEN** a session's `ExpiresAt` is in the future
- **THEN** `IsExpired()` returns `false`

#### Scenario: IsExpired returns true after expiry
- **WHEN** a session's `ExpiresAt` is in the past
- **THEN** `IsExpired()` returns `true`

#### Scenario: IsOwner returns true for matching user
- **WHEN** `IsOwner` is called with the same UUID as the session's `UserID`
- **THEN** it returns `true`

#### Scenario: IsOwner returns false for non-matching user
- **WHEN** `IsOwner` is called with a different UUID
- **THEN** it returns `false`

#### Scenario: IsOwner returns false for nil UserID
- **WHEN** the session's `UserID` is nil
- **THEN** `IsOwner` returns `false` without panicking

---

### Requirement: Session get usecase is tested
`GetUsecase.Execute` SHALL be covered in `internal/usecases/session/get_test.go` using a fake `SessionRepository`.

#### Scenario: Token is hashed correctly before lookup
- **WHEN** `Execute` is called with a raw token
- **THEN** the fake repo is queried with the SHA-256 hex hash of that token, not the raw value

#### Scenario: Not found returns nil without error
- **WHEN** the repo returns nil
- **THEN** `Execute` returns `(nil, nil)`

#### Scenario: Expired session is deleted and returns nil
- **WHEN** the repo returns a session whose `ExpiresAt` is in the past
- **THEN** `Execute` calls `Delete` on the repo and returns `(nil, nil)`

#### Scenario: Valid session is returned
- **WHEN** the repo returns a non-expired session
- **THEN** `Execute` returns that session with no error

---

### Requirement: Session update usecase is tested
`UpdateUsecase.Execute` SHALL be covered in `internal/usecases/session/update_test.go` using fake repos.

#### Scenario: Update without ThemeID skips theme validation
- **WHEN** `input.ThemeID` is nil
- **THEN** the fake ThemeRepo's `GetByID` is never called

#### Scenario: Update with valid ThemeID succeeds
- **WHEN** `input.ThemeID` points to a theme returned by the fake ThemeRepo
- **THEN** the session is updated and returned without error

#### Scenario: Update with unknown ThemeID returns error
- **WHEN** the fake ThemeRepo returns nil for the given ThemeID
- **THEN** `Execute` returns a non-nil error containing "theme not found"

---

### Requirement: Preview generate usecase is tested
`GenerateUsecase.ExecuteForSession` SHALL be covered in `internal/usecases/preview/generate_test.go`.

#### Scenario: Nil ThemeID returns error immediately
- **WHEN** `themeID` is nil
- **THEN** returns an error, fake ThemeRepo is never queried

#### Scenario: Theme not found in repo returns error
- **WHEN** the fake ThemeRepo returns nil for the theme
- **THEN** returns an error containing "theme not found"

#### Scenario: Theme with empty LocalPath returns error
- **WHEN** the fake ThemeRepo returns a theme with `LocalPath == ""`
- **THEN** returns an error before calling the generator

#### Scenario: Theme with non-existent LocalPath returns error
- **WHEN** the fake ThemeRepo returns a theme with a `LocalPath` that does not exist on disk
- **THEN** returns an error containing "theme local path does not exist"

#### Scenario: Happy path writes output and returns preview URL
- **WHEN** the fake ThemeRepo returns a valid theme with an existing `LocalPath` (temp dir)
- **AND** the fake Generator creates an `index.html` in `outputDir`
- **THEN** returns `PreviewURL` of the form `/preview/<rawToken>/`

---

### Requirement: Validation usecase is tested
`ValidateUsecase.Execute` SHALL be covered in `internal/usecases/validation/validate_test.go` using a fake Generator.

#### Scenario: Valid YAML returns Valid=true and empty errors
- **WHEN** the fake Generator returns an empty slice of `ValidationError`
- **THEN** `Execute` returns `ValidateResult{Valid: true, Errors: []}`

#### Scenario: Invalid YAML returns Valid=false with errors
- **WHEN** the fake Generator returns a non-empty slice of `ValidationError`
- **THEN** `Execute` returns `ValidateResult{Valid: false, Errors: <those errors>}`

#### Scenario: Generator error is propagated
- **WHEN** the fake Generator returns a non-nil error
- **THEN** `Execute` returns `(nil, error)`

---

### Requirement: Theme list usecase is tested
`ListUsecase.Execute` SHALL be covered in `internal/usecases/theme/list_test.go`.

#### Scenario: Returns themes from repo
- **WHEN** the fake ThemeRepo's `ListActive` returns two themes
- **THEN** `Execute` returns exactly those two themes

#### Scenario: Repo error is propagated
- **WHEN** the fake ThemeRepo returns an error
- **THEN** `Execute` returns `(nil, error)`

---

### Requirement: Theme sync_builtin usecase is tested
`SyncBuiltinUsecase.Execute` SHALL be covered in `internal/usecases/theme/sync_builtin_test.go` using a temp directory.

#### Scenario: Non-existent builtin dir is silently ignored
- **WHEN** `themesBuiltinDir` points to a directory that does not exist
- **THEN** `Execute` returns nil without calling the fake ThemeRepo

#### Scenario: Builtin dir with subdirs upserts each as a theme
- **WHEN** the temp dir contains two subdirectories ("basic", "default")
- **THEN** the fake ThemeRepo's `Upsert` is called twice, once per slug

---

### Requirement: Template catalog is tested
`GetCatalog` and `GetContent` SHALL be covered in `internal/templates/catalog_test.go`.

#### Scenario: GetCatalog returns at least one entry
- **WHEN** `GetCatalog()` is called
- **THEN** the returned slice has at least one entry with non-empty `Slug`, `Name`, and `File`

#### Scenario: GetContent returns non-empty YAML for known slug
- **WHEN** `GetContent` is called with a slug that exists in the catalog
- **THEN** the returned string is non-empty and contains valid YAML

#### Scenario: GetContent returns empty string for unknown slug
- **WHEN** `GetContent` is called with a slug that does not exist in the catalog
- **THEN** the returned string is `""`

---

### Requirement: Userauth middleware is tested
`UserMiddleware`, `RequireUser`, and `GetUserID` SHALL be covered in `internal/userauth/middleware_test.go` using `httptest` and `gin.New()`.

#### Scenario: Valid cookie sets user ID in context
- **WHEN** the request has a `user_session` cookie with a valid signed JWT
- **THEN** `GetUserID` returns the correct UUID and `true`

#### Scenario: Invalid cookie is silently ignored
- **WHEN** the request has a `user_session` cookie with a tampered token
- **THEN** `GetUserID` returns `(uuid.Nil, false)` and the request continues

#### Scenario: Missing cookie does not block the request
- **WHEN** the request has no `user_session` cookie
- **THEN** the handler is reached and `GetUserID` returns `(uuid.Nil, false)`

#### Scenario: RequireUser blocks unauthenticated request
- **WHEN** `RequireUser` middleware is used and no user is in the context
- **THEN** the response status is 401

#### Scenario: RequireUser allows authenticated request
- **WHEN** `RequireUser` is used after `UserMiddleware` and a valid cookie is present
- **THEN** the handler is reached with status 200

---

### Requirement: Shared test helpers package exists
A package `internal/testhelpers` SHALL export reusable fake implementations: `FakeSessionRepo`, `FakeThemeRepo`, `FakeGenerator`.

#### Scenario: FakeSessionRepo implements ports.SessionRepository
- **WHEN** `FakeSessionRepo` is assigned to a variable of type `ports.SessionRepository`
- **THEN** the code compiles without error

#### Scenario: FakeThemeRepo implements ports.ThemeRepository
- **WHEN** `FakeThemeRepo` is assigned to a variable of type `ports.ThemeRepository`
- **THEN** the code compiles without error

#### Scenario: FakeGenerator implements ports.Generator
- **WHEN** `FakeGenerator` is assigned to a variable of type `ports.Generator`
- **THEN** the code compiles without error

---

### Requirement: Makefile test targets exist
The root `Makefile` SHALL expose `test` and `test-frontend` targets.

#### Scenario: make test runs all Go unit tests
- **WHEN** `make test` is run
- **THEN** it executes `go test ./...` in the `backend/` directory and exits non-zero on failure

#### Scenario: make test-frontend runs Vitest
- **WHEN** `make test-frontend` is run
- **THEN** it executes `pnpm vitest run` in the `frontend/` directory
