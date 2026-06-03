## 1. Backend - Add UUID-Based Session Update Endpoint

- [ ] 1.1 Add `UpdateContent` method to `UserSessionHandler` in `backend/internal/adapters/http/user_session.go`
- [ ] 1.2 Define `UpdateContentRequest` struct accepting optional `yaml_content` and `theme_id` fields
- [ ] 1.3 Validate user ownership of session (return 404 for non-owners)
- [ ] 1.4 Call existing `UpdateUsecase` to persist changes
- [ ] 1.5 Register route `PATCH /api/sessions/:id` in `backend/cmd/api/main.go` in `apiSessions` group
- [ ] 1.6 Add unit test for `UpdateContent` handler covering ownership validation and field updates

## 2. Backend - Add UUID-Based Preview Generation Endpoint

- [ ] 2.1 Add `GeneratePreview` method to `UserSessionHandler` in `backend/internal/adapters/http/user_session.go`
- [ ] 2.2 Parse session UUID from path parameter and resolve session from repository
- [ ] 2.3 Validate user ownership of session (return 404 for non-owners)
- [ ] 2.4 Adapt `GeneratePreviewUsecase` to accept session entity instead of requiring token resolution
- [ ] 2.5 Call adapted usecase and return preview URL in response
- [ ] 2.6 Register route `POST /api/sessions/:id/preview` in `backend/cmd/api/main.go` in `apiSessions` group
- [ ] 2.7 Add unit test for `GeneratePreview` handler covering ownership validation and preview generation

## 3. Backend - Add UUID-Based Validation Endpoint

- [ ] 3.1 Add `ValidateYaml` method to `UserSessionHandler` in `backend/internal/adapters/http/user_session.go`
- [ ] 3.2 Parse session UUID from path parameter and resolve session from repository
- [ ] 3.3 Validate user ownership of session (return 404 for non-owners)
- [ ] 3.4 Adapt `ValidateUsecase` to accept session entity instead of requiring token resolution
- [ ] 3.5 Call adapted usecase and return validation result
- [ ] 3.6 Register route `POST /api/sessions/:id/validate` in `backend/cmd/api/main.go` in `apiSessions` group
- [ ] 3.7 Add unit test for `ValidateYaml` handler covering ownership validation and error handling

## 4. Backend - Adapt Preview Usecase for Session-Based Execution

- [ ] 4.1 Add `ExecuteWithSession` method to `GenerateUsecase` in `backend/internal/usecases/preview/generate.go`
- [ ] 4.2 Extract common generation logic into private helper method used by both `Execute` (token-based) and `ExecuteWithSession`
- [ ] 4.3 Ensure preview files are written to session-based directory (`sessions/:id/preview/`)
- [ ] 4.4 Add unit test for `ExecuteWithSession` method

## 5. Backend - Adapt Validation Usecase for Session-Based Execution

- [ ] 5.1 Add `ExecuteWithSession` method to `ValidateUsecase` in `backend/internal/usecases/validation/validate.go`
- [ ] 5.2 Extract common validation logic into private helper method used by both `Execute` (token-based) and `ExecuteWithSession`
- [ ] 5.3 Add unit test for `ExecuteWithSession` method

## 6. Frontend - Add UUID-Based API Service Functions

- [ ] 6.1 Add `updateSessionContent` function to `frontend/src/services/user.ts` calling `PATCH /api/sessions/:id`
- [ ] 6.2 Add `generateSessionPreview` function to `frontend/src/services/user.ts` calling `POST /api/sessions/:id/preview`
- [ ] 6.3 Add `validateSessionYaml` function to `frontend/src/services/user.ts` calling `POST /api/sessions/:id/validate`
- [ ] 6.4 Add TypeScript types for request/response shapes

## 7. Frontend - Adapt usePreview Hook for Dual Mode

- [ ] 7.1 Update `usePreview` signature to accept `token: string | null` and `sessionId: string | null` in `frontend/src/hooks/usePreview.ts`
- [ ] 7.2 Add mode detection logic: use token-based endpoint if `token` present, otherwise use UUID-based endpoint if `sessionId` present
- [ ] 7.3 Update `generatePreview` call to use appropriate API function based on mode
- [ ] 7.4 Add unit test cases for both token and UUID modes
- [ ] 7.5 Verify debouncing and cooldown logic works in both modes

## 8. Frontend - Adapt useValidation Hook for Dual Mode

- [ ] 8.1 Update `useValidation` signature to accept `token: string | null` and `sessionId: string | null` in `frontend/src/hooks/useValidation.ts`
- [ ] 8.2 Add mode detection logic: use token-based endpoint if `token` present, otherwise use UUID-based endpoint if `sessionId` present
- [ ] 8.3 Update `validateYaml` call to use appropriate API function based on mode
- [ ] 8.4 Add unit test cases for both token and UUID modes

## 9. Frontend - Update StudioPage Component

- [ ] 9.1 Pass both `token` and `sessionId` to `usePreview` hook in `frontend/src/app/studio/page.tsx`
- [ ] 9.2 Pass both `token` and `sessionId` to `useValidation` hook
- [ ] 9.3 Update `handleYamlChange` to call UUID-based update when `sessionId` present and `token` absent
- [ ] 9.4 Update `handleThemeChange` to call UUID-based update when `sessionId` present and `token` absent
- [ ] 9.5 Verify backward compatibility: ensure token-based flow still works unchanged

## 10. Frontend - Verify Dashboard Integration

- [ ] 10.1 Confirm `SessionCard` links generate `/studio?session=:uuid` URLs in `frontend/src/components/user/SessionCard.tsx`
- [ ] 10.2 Test full flow: Dashboard → "Ouvrir dans le studio" → Editor loads and is fully functional
- [ ] 10.3 Verify preview generation works in UUID mode
- [ ] 10.4 Verify validation works in UUID mode
- [ ] 10.5 Verify YAML edits are persisted in UUID mode

## 11. Testing - Backend Integration Tests

- [ ] 11.1 Add integration test for `PATCH /api/sessions/:id` in `backend/internal/adapters/http/user_session_test.go`
- [ ] 11.2 Add integration test for `POST /api/sessions/:id/preview` covering successful generation and error cases
- [ ] 11.3 Add integration test for `POST /api/sessions/:id/validate` covering valid and invalid YAML
- [ ] 11.4 Test ownership enforcement: verify non-owners receive 404
- [ ] 11.5 Test unauthenticated access: verify endpoints return 401

## 12. Testing - Frontend Component Tests

- [ ] 12.1 Update `StudioPage.test.tsx` to cover UUID mode rendering and operations
- [ ] 12.2 Add test case: StudioPage with `?session=uuid` loads and enables editing
- [ ] 12.3 Add test case: Preview hook calls UUID endpoint when sessionId provided
- [ ] 12.4 Add test case: Validation hook calls UUID endpoint when sessionId provided
- [ ] 12.5 Verify no regression: token-based tests still pass

## 13. Manual Testing - End-to-End Verification

- [ ] 13.1 Test anonymous session flow: Create session, verify token-based operations work
- [ ] 13.2 Test authenticated session flow: Login, create session from dashboard, open in studio via UUID
- [ ] 13.3 Test session claiming: Create anonymous session, login, verify claimed session accessible via UUID
- [ ] 13.4 Test preview generation in both modes (token and UUID)
- [ ] 13.5 Test validation in both modes
- [ ] 13.6 Test YAML updates persist correctly in both modes
- [ ] 13.7 Test theme changes persist correctly in both modes
