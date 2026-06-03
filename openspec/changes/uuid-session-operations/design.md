## Context

CVWonder Studio currently supports two session access patterns:
1. **Token-based (anonymous)**: `/studio/:token` - uses SHA256 hash as access credential, all operations via `/api/v1/sessions/:token/*`
2. **UUID-based (authenticated)**: `/studio?session=:uuid` - uses session UUID with cookie-based auth, limited to metadata operations via `/api/sessions/:id/*`

The UUID-based pattern was added to support authenticated users accessing their owned sessions from the dashboard, but only implemented read operations (`GET /api/sessions/:id`). Critical editor operations (preview generation, validation, YAML updates) remain token-only, causing the editor to load in a broken read-only state when accessed via UUID from the dashboard.

**Existing Architecture:**
- Backend: Hexagonal architecture (usecases, ports, adapters)
- Authenticated routes: `/api/sessions/*` (require `userauth.RequireUser()` middleware)
- Anonymous routes: `/api/v1/sessions/*` (no auth, token = credential)
- Generation and validation usecases already exist, but bound to token resolution

## Goals / Non-Goals

**Goals:**
- Enable full editor functionality (preview, validation, updates) when accessing sessions via UUID
- Reuse existing generation and validation logic without duplication
- Maintain backward compatibility with token-based anonymous sessions
- Preserve security model (UUID access requires authentication + ownership)

**Non-Goals:**
- Unifying token and UUID routes into a single access pattern
- Changing anonymous session behavior or token generation
- Adding new features beyond parity with token-based operations
- Modifying database schema or session data model

## Decisions

### Decision 1: Add UUID-Based Endpoints in Existing `/api/sessions` Group

**Rationale:**
- Consistent with authenticated session management pattern already established
- Leverages existing `userauth.RequireUser()` middleware for auth
- Clear separation between anonymous (token) and authenticated (UUID) access patterns

**Alternatives considered:**
- Dual-pattern endpoints accepting both token and UUID: Rejected - increases complexity and blurs security boundaries
- Client-side token resolution: Rejected - exposes tokens unnecessarily and adds extra roundtrip
- Single unified endpoint: Rejected - breaks existing anonymous access and complicates auth logic

**Implementation:**
```go
// Add to backend/cmd/api/main.go in apiSessions group
apiSessions.PATCH("/:id", userSessionHandler.UpdateContent)
apiSessions.POST("/:id/preview", userSessionHandler.GeneratePreview)
apiSessions.POST("/:id/validate", userSessionHandler.ValidateYaml)
```

### Decision 2: Adapt Frontend Hooks to Support Both Access Modes

**Rationale:**
- Single component (`StudioPage`) needs to work with both token and UUID
- Hooks encapsulate API communication - ideal place to branch on access mode
- Avoids duplicating preview/validation logic in multiple places

**Implementation approach:**
- Pass both `token` and `sessionId` to hooks (`usePreview`, `useValidation`)
- Hooks determine which API endpoint to call based on which identifier is available
- Priority: `token` first (anonymous), then `sessionId` (authenticated)

```typescript
// hooks/usePreview.ts
export function usePreview(token: string | null, sessionId: string | null) {
  // Determine endpoint based on available identifier
  const endpoint = token 
    ? `/api/v1/sessions/${token}/preview`
    : sessionId
    ? `/api/sessions/${sessionId}/preview`
    : null
  // ... rest of logic
}
```

**Alternatives considered:**
- Separate hooks for token and UUID modes: Rejected - code duplication and complex component logic
- Mode parameter instead of dual identifiers: Rejected - less intuitive API, requires manual coordination

### Decision 3: Reuse Existing Usecases with ID-Based Resolution

**Rationale:**
- Generation and validation usecases (`GenerateUsecase`, `ValidateUsecase`) already implement the business logic
- Only difference is session resolution: token → hash → session vs. UUID → session
- Avoids duplicating complex generation and validation code

**Implementation:**
```go
// New handler methods in UserSessionHandler
func (h *UserSessionHandler) GeneratePreview(c *gin.Context) {
    sessionID := parseUUID(c.Param("id"))
    userID := getUserID(c)
    
    session, err := h.sessions.GetByID(ctx, sessionID)
    if session.UserID != userID { return 404 }
    
    // Reuse existing usecase
    h.generateUC.ExecuteWithSession(ctx, session)
}
```

**Alternatives considered:**
- Duplicate generation logic in new handlers: Rejected - violates DRY, increases maintenance burden
- Extend existing handlers to accept UUID: Rejected - mixes auth models and complicates token-based flow

### Decision 4: Combined YAML + Theme Update in Single Endpoint

**Rationale:**
- Frontend already has `handleYamlChange` and `handleThemeChange` as separate user actions
- Single `PATCH /api/sessions/:id` accepting optional `yaml_content` and `theme_id` mirrors existing `PATCH /api/v1/sessions/:token` pattern
- Reduces number of new endpoints and API surface area

**Implementation:**
```go
// Request body
type UpdateContentRequest struct {
    YamlContent *string    `json:"yaml_content,omitempty"`
    ThemeID     *uuid.UUID `json:"theme_id,omitempty"`
}

// Handler updates only provided fields
```

**Alternatives considered:**
- Separate endpoints (`PATCH /:id/yaml`, `PATCH /:id/theme`): Rejected - inconsistent with existing `/api/sessions/:id/theme` pattern and adds complexity
- Require both fields: Rejected - forces unnecessary updates when only one field changes

## Risks / Trade-offs

**Risk:** Frontend hooks become more complex with dual-mode logic  
**Mitigation:** Encapsulate mode detection in helper functions, add comprehensive unit tests for both modes

**Risk:** Inconsistency between token-based and UUID-based preview URLs  
**Context:** Token-based previews use `/preview/:token/index.html`, UUID-based should use `/preview/:id/index.html`  
**Mitigation:** Preview handler already supports both patterns (`:token` accepts hex strings and UUIDs)

**Risk:** Breaking existing code that assumes token is always present  
**Mitigation:** Use explicit null checks (`token ?? null`) and prioritize token over sessionId in hooks to maintain backward compatibility

**Trade-off:** Two parallel API patterns instead of unified approach  
**Justification:** Reflects fundamental difference in security model (token = bearer credential vs. UUID + cookie auth). Unification would require breaking changes to anonymous access or exposing tokens unnecessarily.

## Open Questions

None - design is implementation-ready.
