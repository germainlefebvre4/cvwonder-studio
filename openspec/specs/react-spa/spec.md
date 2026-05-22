## ADDED Requirements

### Requirement: SPA built with Vite and React
The frontend SHALL be a pure single-page application (SPA) built with Vite (React + TypeScript). It SHALL produce a static `dist/` output that is embedded in the Go binary. The Vite dev server SHALL proxy `/api/*` and `/preview/*` to the Go backend at `VITE_API_URL` (default `http://localhost:8080`).

#### Scenario: Production build produces static files
- **WHEN** `pnpm build` is run
- **THEN** a `dist/` directory is produced containing `index.html` and all assets

#### Scenario: Dev server proxies API
- **WHEN** the Vite dev server runs and a request is made to `/api/v1/themes`
- **THEN** the request is proxied to the Go backend without CORS errors

---

### Requirement: Design system uses Radix UI primitives and Radix Colors
The system SHALL use `@radix-ui/*` primitives directly (without shadcn/ui abstraction). The color system SHALL use `@radix-ui/colors` blue and slate scales with semantic CSS tokens defined via Tailwind v4 `@theme {}`. The palette SHALL preserve the current blue/navy aesthetic.

Semantic tokens:
- `--color-text-primary`: `var(--blue-12)`
- `--color-text-secondary`: `var(--slate-11)`
- `--color-surface-default`: `var(--slate-1)`
- `--color-surface-subtle`: `var(--slate-2)`
- `--color-surface-muted`: `var(--slate-3)`
- `--color-border`: `var(--slate-6)`
- `--color-accent`: `var(--blue-9)`
- `--color-accent-hover`: `var(--blue-10)`
- `--color-destructive`: `var(--red-9)`

#### Scenario: Dark mode auto-applies correct colors
- **WHEN** the OS prefers dark mode (`prefers-color-scheme: dark`)
- **THEN** Radix dark scale vars are active and text/surfaces invert appropriately

#### Scenario: Accent color matches current design
- **WHEN** the UI renders primary action buttons
- **THEN** the button background is `--blue-9` (equivalent to current `blue-600`)

---

### Requirement: Landing page fetches available templates on mount
The landing page SHALL call `GET /api/v1/templates` on mount and store the result in local component state. The list SHALL be used to populate the split button dropdown. If the request fails, the dropdown SHALL be hidden and only the primary action (session vide) SHALL be available.

#### Scenario: Templates are loaded on mount
- **WHEN** the landing page renders
- **THEN** `GET /api/v1/templates` is called and the response is stored

#### Scenario: Template fetch failure degrades gracefully
- **WHEN** `GET /api/v1/templates` returns an error
- **THEN** the split button chevron is hidden and only the primary "Créer mon CV" button is visible

---

### Requirement: CTA uses a split button with template dropdown
The landing page CTA SHALL render as a split button: a primary action zone ("Créer mon CV — it's free") and a chevron zone that opens a dropdown. Clicking the primary zone SHALL create a session with no `template_id` (empty YAML). Clicking the chevron SHALL open a dropdown listing the available templates. Selecting a template from the dropdown SHALL call `POST /api/v1/sessions` with the corresponding `template_id` and redirect to `/studio/:token`.

#### Scenario: Primary click creates empty session
- **WHEN** the user clicks the primary zone of the split button
- **THEN** `POST /api/v1/sessions` is called without `template_id` and the user is redirected to `/studio/:token`

#### Scenario: Chevron opens template dropdown
- **WHEN** the user clicks the chevron zone of the split button
- **THEN** a dropdown appears listing the available templates by name

#### Scenario: Selecting a template creates a pre-filled session
- **WHEN** the user selects a template from the dropdown (e.g., "Développeur (FR)")
- **THEN** `POST /api/v1/sessions` is called with `{ "template_id": "developer-fr" }` and the user is redirected to `/studio/:token` with the YAML pre-filled

#### Scenario: Dropdown closes on outside click
- **WHEN** the dropdown is open and the user clicks outside it
- **THEN** the dropdown closes without creating a session

---

### Requirement: Landing page preserves current structure
The landing page SHALL render at `/`. It SHALL include: a glassmorphism header (logo + nav links), a hero section with gradient text, a features grid (3 columns), a "How It Works" section, and a footer. The gradient background SHALL use Radix Colors blue/slate scales. The primary CTA in the hero section SHALL be a split button (primary action + chevron dropdown) as defined in the split button requirement above.

#### Scenario: Landing page renders
- **WHEN** a user navigates to `/`
- **THEN** the page displays the hero section with a split button CTA

#### Scenario: Primary CTA creates a session and redirects
- **WHEN** the user clicks the primary zone of the split button
- **THEN** `POST /api/v1/sessions` is called and the user is redirected to `/studio/:token`

---

### Requirement: Studio page has split editor/preview layout
The studio page SHALL render at `/studio/:token`. It SHALL be full-viewport (`h-screen`, no scroll) with a header bar and a two-panel split: YAML editor (left) and preview iframe (right). The panels SHALL be resizable via `react-resizable-panels`.

#### Scenario: Studio page loads session data
- **WHEN** the user navigates to `/studio/:token` with a valid token
- **THEN** `GET /api/v1/sessions/:token` is called and the YAML editor is populated with `yaml_content`

#### Scenario: Session not found redirects to landing
- **WHEN** the user navigates to `/studio/:token` with an invalid token
- **THEN** the user is redirected to `/`

---

### Requirement: YAML editor uses CodeMirror 6
The YAML editor SHALL use `@uiw/react-codemirror` with `@codemirror/lang-yaml`. It SHALL provide client-side validation via AJV against the bundled JSON schema (`/schemas/cvwonder.schema.json`). Validation errors SHALL appear as inline diagnostics in the editor gutter. The editor SHALL debounce YAML changes by 2000ms before triggering preview generation.

#### Scenario: Invalid YAML shows inline error
- **WHEN** the user types YAML that fails schema validation
- **THEN** an error marker appears in the editor gutter at the relevant line within 500ms

#### Scenario: Preview is triggered after debounce
- **WHEN** the user stops typing for 2 seconds
- **THEN** `POST /api/v1/sessions/:token/preview` is called automatically

---

### Requirement: Theme selector updates session
The header SHALL include a theme `<Select>` component (Radix `@radix-ui/react-select`) populated from `GET /api/v1/themes`. Changing the theme SHALL call `PATCH /api/v1/sessions/:token` with the new `theme_id` and trigger a preview regeneration.

#### Scenario: Themes are loaded on page mount
- **WHEN** the studio page loads
- **THEN** the theme selector displays all available themes

#### Scenario: Theme change re-renders preview
- **WHEN** the user selects a different theme
- **THEN** `PATCH /api/v1/sessions/:token` is called and a new preview is generated

---

### Requirement: Preview iframe renders generated CV
The preview panel SHALL contain an `<iframe>` pointing to `/preview/:token/cv.html`. The iframe SHALL refresh automatically after a new preview is generated. The iframe SHALL have `sandbox="allow-same-origin allow-scripts"`.

#### Scenario: Preview loads after generation
- **WHEN** a preview is successfully generated
- **THEN** the iframe `src` is set to `/preview/:token/cv.html` and the CV renders

---

### Requirement: Zustand store manages editor state
The application SHALL use a single Zustand store with the following state: `yamlContent`, `selectedThemeId`, `validationErrors`, `previewUrl`, `isGenerating`, `isExporting`. The store SHALL not persist to localStorage.

#### Scenario: Store resets on navigation away
- **WHEN** the user navigates from one studio token to another
- **THEN** the store is reset to its initial state before loading the new session

---

### Requirement: Session token is preserved in the URL
The studio URL SHALL include the session token as a path parameter (`/studio/:token`). The token SHALL be visible in the address bar so users can bookmark or share their session URL.

#### Scenario: User can return to session via URL
- **WHEN** a user copies the studio URL and reopens it
- **THEN** the session YAML and theme are restored from the backend
