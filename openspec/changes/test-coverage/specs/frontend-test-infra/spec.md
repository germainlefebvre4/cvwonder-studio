## ADDED Requirements

### Requirement: Vitest is installed and configured
The frontend project SHALL have Vitest, jsdom, and Testing Library installed as devDependencies, with a `vitest.config.ts` that resolves path aliases (`@/`) identically to `vite.config.ts`.

#### Scenario: pnpm vitest run exits successfully with no test files
- **WHEN** `pnpm vitest run` is executed in `frontend/` after setup
- **THEN** it exits with code 0 (no tests = no failures)

#### Scenario: Path alias @ resolves correctly in test files
- **WHEN** a test file imports from `@/store/user`
- **THEN** Vitest resolves it to `src/store/user.ts` without error

---

### Requirement: msw v2 is installed for API mocking
`msw` SHALL be installed as a devDependency. A `src/mocks/` directory SHALL contain a `handlers.ts` file with msw request handlers mirroring the backend API routes, and a `server.ts` that sets up a Node.js msw server for tests.

#### Scenario: msw server starts and stops around test suite
- **WHEN** a test file imports from `src/mocks/server`
- **THEN** `server.listen()` and `server.close()` can be called without error

---

### Requirement: Global test setup file is configured
A `src/test-setup.ts` file SHALL be referenced in `vitest.config.ts` as `setupFilesAfterFramework`. It SHALL import `@testing-library/jest-dom` matchers and configure the msw server lifecycle.

#### Scenario: jest-dom matchers are available in all test files
- **WHEN** a test uses `expect(element).toBeInTheDocument()`
- **THEN** the assertion works without additional imports
