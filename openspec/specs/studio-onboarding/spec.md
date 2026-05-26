# Studio Onboarding

## Purpose

Define the onboarding experience for new Studio users: automatic theme selection, immediate preview generation, skeleton placeholders, and a template picker for empty sessions — so users see a meaningful preview and can start editing with minimal friction.

## Requirements

### Requirement: Studio auto-selects the first available theme when none is set
When the Studio loads a session whose `theme_id` is `null`, the system SHALL automatically fetch the list of available themes and select the first one. The selected theme SHALL be persisted to the session via `PATCH /api/v1/sessions/:token` and set in the Zustand store. If the theme list fetch fails or returns an empty list, the system SHALL proceed without auto-selection (no error shown to the user).

#### Scenario: Session loads with no theme — first theme is auto-selected
- **WHEN** the Studio loads a session with `theme_id = null` and at least one theme is available
- **THEN** `listThemes()` is called, the first theme is set as `selectedThemeId` in the store, and a `PATCH /api/v1/sessions/:token` is sent with `{ theme_id: <first-theme-id> }`

#### Scenario: Session loads with a theme already set — no auto-selection
- **WHEN** the Studio loads a session with a non-null `theme_id`
- **THEN** `listThemes()` is NOT called for auto-selection and the existing theme is used as-is

#### Scenario: Theme list is empty or unavailable — no error shown
- **WHEN** the Studio loads a session with `theme_id = null` and `GET /api/v1/themes` fails or returns `[]`
- **THEN** no error message is shown to the user and the Studio continues to load normally

---

### Requirement: Studio triggers an immediate preview generation on first load
When the Studio loads a session that has both non-empty `yamlContent` and a `selectedThemeId` (either from the session or after auto-selection), the system SHALL trigger a preview generation immediately — without waiting for the debounce interval. This initial generation SHALL show the loading overlay (`isGenerating = true`). Subsequent generations (triggered by user edits) SHALL continue to use the debounce mechanism.

#### Scenario: Fresh session with template — immediate preview fires
- **WHEN** the Studio loads a session with non-empty YAML and a theme becomes available (via auto-selection)
- **THEN** a preview generation request is sent immediately, the loading overlay is shown, and the preview renders without the user typing anything

#### Scenario: Returning user session — immediate preview fires
- **WHEN** the Studio loads a session with non-empty YAML and non-null `theme_id` already stored
- **THEN** a preview generation request is sent immediately after session load, bypassing the 1-second debounce

#### Scenario: Empty YAML session — no immediate preview
- **WHEN** the Studio loads a session with empty `yamlContent`
- **THEN** no preview generation is triggered on mount

---

### Requirement: PreviewFrame shows a CV skeleton placeholder when no preview URL is available
When `previewUrl` is null and the preview is not currently generating, the PreviewFrame SHALL display an animated skeleton layout that visually suggests a CV document structure (name block, sections, text lines). The skeleton SHALL use the `animate-pulse` animation and the design system's surface/border tokens. The plain text "Preview will appear here after the first generation" SHALL NOT appear.

#### Scenario: No preview URL and not generating — skeleton is shown
- **WHEN** `previewUrl === null` and `isGenerating === false`
- **THEN** the PreviewFrame displays an animated skeleton placeholder, not a text message

#### Scenario: Generation in progress — skeleton is replaced by generating overlay
- **WHEN** `isGenerating === true`
- **THEN** the PreviewFrame shows the existing logo pulse animation, not the skeleton

#### Scenario: Preview URL available — iframe is shown
- **WHEN** `previewUrl !== null`
- **THEN** the PreviewFrame shows the iframe, not the skeleton

---

### Requirement: Studio shows an in-panel template picker when YAML is empty on load
When the Studio loads a session whose `yamlContent` is empty (empty string) at the time the session is fetched, the left panel SHALL display a `TemplatePicker` component instead of the YAML editor. The `TemplatePicker` SHALL call `GET /api/v1/templates` on mount and display available templates as selectable cards. It SHALL also offer a "Start from scratch" option that loads the `minimal` template content.

#### Scenario: Empty YAML session — TemplatePicker shown instead of editor
- **WHEN** the Studio loads a session with `yamlContent === ''`
- **THEN** the left panel shows the TemplatePicker, not the CodeMirror editor

#### Scenario: Non-empty YAML session — editor shown, no TemplatePicker
- **WHEN** the Studio loads a session with non-empty `yamlContent`
- **THEN** the left panel shows the CodeMirror editor directly, TemplatePicker is not rendered

#### Scenario: Template selected from picker — YAML is updated and editor appears
- **WHEN** the user selects a template from the TemplatePicker
- **THEN** `PATCH /api/v1/sessions/:token` is called with the template's YAML content, the store's `yamlContent` is updated, and the TemplatePicker is replaced by the CodeMirror editor

#### Scenario: "Start from scratch" selected — minimal template loaded and editor appears
- **WHEN** the user clicks "Start from scratch" in the TemplatePicker
- **THEN** the `minimal` template content is fetched, `yamlContent` is updated in the store and persisted, and the editor appears

#### Scenario: Template fetch fails in picker — error message shown, non-blocking
- **WHEN** `GET /api/v1/templates` fails inside the TemplatePicker
- **THEN** an inline error message is shown within the picker and the "Start from scratch" option remains available

---

### Requirement: TemplatePicker disappears once YAML content is set
The TemplatePicker SHALL be driven purely by the `yamlContent` value in the Zustand store. Once `yamlContent` becomes non-empty (from any source: template selection, "start from scratch", or external update), the TemplatePicker SHALL unmount and the CodeMirror editor SHALL render with the current YAML content.

#### Scenario: YAML becomes non-empty — editor replaces picker
- **WHEN** `yamlContent` transitions from `''` to a non-empty string in the store
- **THEN** the TemplatePicker unmounts and the CodeMirror editor renders with the new content
