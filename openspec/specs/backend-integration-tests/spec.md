## ADDED Requirements

### Requirement: Integration test build tag gates DB tests
All integration test files SHALL begin with `//go:build integration` so they are excluded from the default `go test ./...` run.

#### Scenario: Default test run excludes integration tests
- **WHEN** `go test ./...` is run without `-tags=integration`
- **THEN** no database connection is attempted and no container is started

#### Scenario: Integration test run includes DB tests
- **WHEN** `go test -tags=integration ./...` is run with a Docker daemon available
- **THEN** all integration tests are compiled and executed

---

### Requirement: TestMain spins up a postgres container and runs migrations
Each integration test package that needs a database SHALL use `TestMain` to start a `postgres:16-alpine` testcontainer, run all migrations via `golang-migrate`, and tear down after the suite.

#### Scenario: Container starts and migrations succeed
- **WHEN** `TestMain` runs
- **THEN** a Postgres container is started, all migrations in `db/migrations/` run without error, and the suite begins

#### Scenario: Container is torn down after suite
- **WHEN** the test suite finishes (pass or fail)
- **THEN** the container is stopped and removed with no leaked resources

---

### Requirement: Session repository adapter is integration-tested
`adapters/repository.SessionRepository` SHALL be covered by integration tests in `internal/adapters/repository/session_integration_test.go`.

#### Scenario: Insert then GetByTokenHash returns the session
- **WHEN** a session is inserted via `Insert` and then retrieved via `GetByTokenHash` with its hash
- **THEN** the returned session has the same ID, TokenHash, and YamlContent

#### Scenario: GetByTokenHash with unknown hash returns nil
- **WHEN** `GetByTokenHash` is called with a hash that was never inserted
- **THEN** it returns `(nil, nil)`

#### Scenario: Update changes YamlContent
- **WHEN** `Update` is called with a new `YamlContent` string
- **THEN** the subsequent `GetByTokenHash` returns the updated content

#### Scenario: Delete removes the session
- **WHEN** `Delete` is called with a valid session ID
- **THEN** `GetByTokenHash` subsequently returns nil for that session

#### Scenario: DeleteExpired removes only expired sessions
- **WHEN** one session is expired and one is not
- **THEN** `DeleteExpired` removes only the expired one

---

### Requirement: Theme repository adapter is integration-tested
`adapters/repository.ThemeRepository` SHALL be covered in `internal/adapters/repository/theme_integration_test.go`.

#### Scenario: Upsert creates a new theme
- **WHEN** `Upsert` is called with a new theme slug
- **THEN** `GetBySlug` returns the theme

#### Scenario: Upsert updates an existing theme
- **WHEN** `Upsert` is called twice with the same slug but different name
- **THEN** `GetBySlug` returns the updated name

#### Scenario: ListActive returns only non-deleted themes
- **WHEN** multiple themes exist and one has been soft-deleted
- **THEN** `ListActive` does not include the deleted theme

#### Scenario: GetByID returns the correct theme
- **WHEN** `GetByID` is called with a known UUID
- **THEN** it returns the theme with that ID

#### Scenario: GetByID with unknown UUID returns nil
- **WHEN** `GetByID` is called with a UUID that was never inserted
- **THEN** it returns `(nil, nil)`

---

### Requirement: make test-int target runs integration tests
The root `Makefile` SHALL expose a `test-int` target.

#### Scenario: make test-int runs integration test suite
- **WHEN** `make test-int` is run with a Docker daemon available
- **THEN** it executes `go test -tags=integration ./...` in `backend/` and exits non-zero on failure
