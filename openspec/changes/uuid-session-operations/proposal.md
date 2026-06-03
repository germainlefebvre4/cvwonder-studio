## Why

When authenticated users access their sessions from the dashboard via "Ouvrir dans le studio", the URL pattern `/studio?session=<UUID>` loads the session data but renders the editor in a broken read-only state. Preview generation, validation, and content updates are silently disabled because these features require a token (SHA256 hash) rather than a UUID. This architectural mismatch between token-based anonymous access and UUID-based authenticated access creates a poor user experience where the editor appears functional but is non-interactive.

## What Changes

- Add UUID-based backend endpoints for authenticated session operations:
  - `PATCH /api/sessions/:id` for updating YAML content and theme
  - `POST /api/sessions/:id/preview` for generating previews
  - `POST /api/sessions/:id/validate` for YAML validation
- Update frontend hooks (`usePreview`, `useValidation`) to support both token-based and UUID-based access patterns
- Modify `StudioPage` to use UUID-based APIs when accessing via `?session=<UUID>`
- Update `handleYamlChange` and `handleThemeChange` to persist changes via UUID when token is unavailable
- Ensure preview generation and validation work seamlessly for both anonymous (token) and authenticated (UUID) users

## Capabilities

### New Capabilities

None - this extends existing session management capabilities.

### Modified Capabilities

- `user-sessions`: Add requirements for UUID-based editor operations (preview generation, validation, content updates) when accessing owned sessions via UUID rather than token.

## Impact

**Backend:**
- New authenticated routes in `/api/sessions/:id` group (requires `userauth.RequireUser()`)
- Reuse existing generation and validation usecases, but accept UUID instead of token
- No database schema changes needed

**Frontend:**
- `hooks/usePreview.ts` - accept optional `sessionId` parameter alongside `token`
- `hooks/useValidation.ts` - accept optional `sessionId` parameter alongside `token`
- `app/studio/page.tsx` - pass `sessionId` to hooks when available
- `services/user.ts` - new functions for UUID-based update, preview, validate

**User Experience:**
- Dashboard links to owned sessions work fully (no more read-only mode)
- Anonymous session behavior unchanged (still uses token-based access)
- Shared session access unchanged (uses separate endpoints)
