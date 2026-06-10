## MODIFIED Requirements

### Requirement: Studio page has split editor/preview layout
The studio page SHALL render at `/studio/:token` (or via `?session=:id`). It SHALL be full-viewport (`h-screen`, no scroll) with a header bar and resizable panels using `react-resizable-panels`. The layout SHALL support toggling between three editing modes:
1. **Code Mode**: Shows the YAML editor (left) and the preview iframe (right).
2. **Visual Mode**: Shows the No-Code Visual Assistant (left) and the preview iframe (right).
3. **Split Mode**: Shows the YAML editor (left), No-Code Visual Assistant (center), and the preview iframe (right).

#### Scenario: Studio page loads session data
- **WHEN** the user navigates to `/studio/:token` with a valid token
- **THEN** `GET /api/v1/sessions/:token` is called and the selected editor (YAML or Visual) is populated with data

#### Scenario: Session not found redirects to landing
- **WHEN** the user navigates to `/studio/:token` with an invalid token
- **THEN** the user is redirected to `/`

#### Scenario: Toggling layouts alters panels instantly
- **WHEN** the user clicks the "Visual Assistant" view toggle in the header
- **THEN** the left panel switches from the CodeMirror editor to the form-based Visual Assistant while preserving the preview pane

#### Scenario: Split mode shows both editors and preview
- **WHEN** the user selects the "Split Mode" in the header
- **THEN** the page renders three panels in a row: YAML code, Visual Form, and Live Preview

#### Scenario: Visual Form edits trigger backend update and preview refresh
- **WHEN** the user modifies an input in the Visual Assistant form
- **THEN** the modified YAML is saved to the backend database via a debounced API call, and a new preview is requested to update the rendered preview frame

#### Scenario: Switching layout modes resets panel size calibration
- **WHEN** the user switches layout modes (e.g. from Split to Code, and back to Split)
- **THEN** the panel group layout is re-initialized, ensuring that the panel dividers are correctly calibrated and resizing one divider does not cause layout distortion or unexpected shift of the other dividers
