## ADDED Requirements

### Requirement: src/lib/utils.ts is unit-tested
All exported functions in `src/lib/utils.ts` SHALL be covered by tests in `src/lib/utils.test.ts`.

#### Scenario: Each utility function has at least one passing test
- **WHEN** `pnpm vitest run src/lib/utils.test.ts` is executed
- **THEN** all tests pass

---

### Requirement: useDebounce hook is tested
The `useDebounce` hook SHALL be tested in `src/hooks/useDebounce.test.ts` using Vitest's fake timer API.

#### Scenario: Debounced value updates after delay
- **WHEN** the input value changes and the delay elapses
- **THEN** the debounced value reflects the new input

#### Scenario: Debounced value does not update before delay
- **WHEN** the input value changes but the delay has not elapsed
- **THEN** the debounced value still reflects the previous input

---

### Requirement: useValidation hook is tested
The `useValidation` hook SHALL be tested in `src/hooks/useValidation.test.ts` using msw to intercept validation API calls.

#### Scenario: Valid YAML triggers no error state
- **WHEN** the hook is called with valid YAML and the msw handler returns `{valid: true, errors: []}`
- **THEN** the hook's `errors` state is an empty array

#### Scenario: Invalid YAML surfaces error messages
- **WHEN** the msw handler returns `{valid: false, errors: [{message: "field required"}]}`
- **THEN** the hook's `errors` state contains that error message

#### Scenario: API failure does not crash the hook
- **WHEN** the msw handler returns a 500 error
- **THEN** the hook handles it gracefully (no uncaught exception)

---

### Requirement: usePreview hook is tested
The `usePreview` hook SHALL be tested in `src/hooks/usePreview.test.ts` using msw.

#### Scenario: Successful generation updates preview URL
- **WHEN** `trigger()` is called and the msw handler returns `{preview_url: "/preview/abc/"}`
- **THEN** the hook's `previewUrl` state is set to that URL

#### Scenario: Generation error surfaces in error state
- **WHEN** the msw handler returns a 4xx error
- **THEN** the hook's `error` state is non-null

---

### Requirement: User store is unit-tested
`src/store/user.ts` SHALL be tested in `src/store/user.test.ts` with no DOM or network dependencies.

#### Scenario: Initial state has no user
- **WHEN** the store is accessed without any prior action
- **THEN** `user` is null and `isAuthenticated` is false

#### Scenario: setUser updates user and isAuthenticated
- **WHEN** `setUser` is called with a user object
- **THEN** `user` reflects the new value and `isAuthenticated` is true

#### Scenario: setUser(null) clears user
- **WHEN** `setUser(null)` is called
- **THEN** `user` is null and `isAuthenticated` is false

---

### Requirement: Studio store is unit-tested
`src/store/studio.ts` SHALL be tested in `src/store/studio.test.ts`.

#### Scenario: Initial state reflects default values
- **WHEN** the studio store is accessed fresh
- **THEN** session, yamlContent, and theme reflect their initial defaults

#### Scenario: Setting YAML content updates state
- **WHEN** a YAML content setter action is dispatched
- **THEN** the store reflects the new YAML string

---

### Requirement: Dashboard quota logic is smoke-tested
The quota computation logic in `DashboardPage` (active count, percentage, `quotaFull` flag) SHALL be verified in `src/pages/user/Dashboard.test.tsx`.

#### Scenario: Quota bar shows full at 100%
- **WHEN** `data.active === data.max`
- **THEN** the rendered quota bar has the error color class and the full-quota message is visible

#### Scenario: New session link hidden when quota full
- **WHEN** `quotaFull` is true
- **THEN** the "+ Nouvelle session" link is not in the document

#### Scenario: New session link visible when under quota
- **WHEN** `data.active < data.max`
- **THEN** the "+ Nouvelle session" link is in the document

---

### Requirement: Login page anon token passthrough is tested
The `LoginPage` component SHALL be tested in `src/pages/user/Login.test.tsx`.

#### Scenario: Login URL includes anon token when present in localStorage
- **WHEN** `anon_session_token` is set in localStorage and the Google login button is clicked
- **THEN** `window.location.href` is set to `/api/auth/login?anon_tok=<encoded-token>`

#### Scenario: Login URL is plain when no anon token in localStorage
- **WHEN** `anon_session_token` is absent from localStorage
- **THEN** `window.location.href` is set to `/api/auth/login` with no query string

#### Scenario: Authenticated user is redirected to dashboard
- **WHEN** the user store has `isAuthenticated: true`
- **THEN** `navigate('/dashboard', { replace: true })` is called
