## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Landing page preserves current structure
The landing page SHALL render at `/`. It SHALL include: a glassmorphism header (logo + nav links), a hero section with gradient text, a features grid (3 columns), a "How It Works" section, and a footer. The gradient background SHALL use Radix Colors blue/slate scales. The primary CTA in the hero section SHALL be a split button (primary action + chevron dropdown) as defined in the split button requirement above.

#### Scenario: Landing page renders
- **WHEN** a user navigates to `/`
- **THEN** the page displays the hero section with a split button CTA

#### Scenario: Primary CTA creates a session and redirects
- **WHEN** the user clicks the primary zone of the split button
- **THEN** `POST /api/v1/sessions` is called and the user is redirected to `/studio/:token`
