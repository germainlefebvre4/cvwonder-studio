## Context

CVWonder Studio currently provides a text-only YAML editor built on CodeMirror 6. While developers appreciate the precision of writing structured text, less technical users struggle with manual formatting and syntax errors. To bridge this gap, we are designing a No-Code Visual Assistant side-by-side with the editor. 

The core challenge is maintaining high-fidelity synchronization: we must allow users to edit via form inputs while fully preserving their hand-crafted comments, custom block orders, and formatting style in the YAML file.

## Goals / Non-Goals

**Goals:**
- Provide a responsive layout in the Studio with Code-only, Visual-only, or Split-pane configurations.
- Achieve real-time bidirectional synchronization between the visual form and YAML.
- Use Abstract Syntax Tree (AST) patching to perform surgical edits, fully preserving YAML comments, indentation, and structure.
- Suspend visual synchronization gracefully if the user introduces a syntax error in the code editor, safeguarding state integrity.

**Non-Goals:**
- Supporting editing of schemas other than the CVWonder JSON Schema.
- Automatically fixing syntactically invalid YAML in the code editor (the user must correct it, assisted by inline linter warnings).
- Storing layout settings in the remote PostgreSQL database (sessionStorage is sufficient).

## Decisions

### 1. Choice of Parsing Library: Modern `yaml` (npm `yaml`)
- **Choice**: Use the modern `yaml` package (v2.x) by Eemeli Aro.
- **Alternatives Considered**: `js-yaml` (lacks modern AST mutation API, does not preserve comments on stringify), `yaml-ast-parser` (deprecated/stale).
- **Rationale**: The `yaml` library is the industry standard for AST manipulation in Node/Browser environments. It supports `parseDocument` to load a mutable AST, and provides helper APIs (`doc.getIn()`, `doc.setIn()`, `doc.deleteIn()`, and sequences mutation) that stringify back with **100% preservation of adjacent comments and formatting**.

### 2. Synchronization Flow with State Guard
- **Choice**: Implement an asymmetric data-flow controlled by an `isYamlValid` state guard.
- **Data Flow**:
  - **YAML Code ➔ Visual Form**:
    When code changes, we parse the document into an AST. If it is syntactically valid, we convert the AST to a JS object using `doc.toJS()` and populate the Zustand `formData` store. If it is invalid, we flag `isYamlValid = false` and freeze the form's update triggers, displaying an alert banner.
  - **Visual Form ➔ YAML Code**:
    When a form input changes, we trigger `updateFormField(path, value)`. This action retrieves the current YAML, parses it into an AST, surgically updates the target node via `doc.setIn(path, value)`, and converts the AST back to string using `doc.toString()`. This string is then set as the new YAML content.
  - **YAML Content ➔ Backend & Live Preview**:
    Because the live PDF/HTML preview relies on the backend database containing the latest session data, any changes to `yamlContent` must be synchronized to the database. We use a hybrid approach to ensure immediate code-editor saves and debounced visual-editor saves:
    1. **Code Editor changes** continue to call `handleYamlChange` immediately to update the backend. This updates a ref `lastSavedYamlRef.current` with the new YAML.
    2. **Visual Editor changes** update the Zustand store directly. A centralized `useEffect` in `StudioPage` watches `yamlContent`, debounces updates by 300ms, and checks if the new YAML differs from `lastSavedYamlRef.current`. If it differs, it triggers a backend PATCH save and updates `lastSavedYamlRef.current`.
    3. **Live Preview trigger (`usePreview`)** debounces for 1000ms. Since 1000ms > 300ms, the backend update completes before the preview generation request is triggered, ensuring the rendered output is perfectly synchronized with visual edits.
- **Rationale**: This prevents infinite update loops, avoids database spam during typing, and guarantees that the generated preview always reflects the latest state of either editor.

```
 [User types in Form] ➔ Trigger updateFormField(path, value)
                             │
                             ▼
                    Parse current YAML to AST
                             │
                             ▼
                    Surgically set node value: doc.setIn(path, value)
                             │
                             ▼
                    Update Zustand `yamlContent` with doc.toString() & `formData`
                             │
                             ▼
                    StudioPage useEffect (debounced 300ms)
                             │
                             ▼
                    PATCH /api/v1/sessions/:token (Update Backend DB)
                             │
                             ▼
                    usePreview trigger (debounced 1000ms)
                             │
                             ▼
                    POST /api/v1/sessions/:token/preview (Generate Preview)
```

### 3. Modular Accordion Layout for Form Sections
- **Choice**: Hand-craft form sections using Radix UI Accordion primitives (`@radix-ui/react-accordion`) rather than schema-form auto-generators.
- **Rationale**: Form auto-generators yield dense, unattractive forms that are hard to style with Tailwind v4. Designing dedicated sub-components (e.g., `PersonalInfoForm`, `CareerForm`, `SkillsForm`) guarantees a gorgeous, highly accessible, responsive experience that fits perfectly with CVWonder's sleek blue/slate theme.

### 4. Resizable Panels State Reset
- **Choice**: Provide `key={viewLayout}` on the `PanelGroup` component.
- **Rationale**: `react-resizable-panels` tracks and caches panel layout sizes internally. When toggling layouts, the panel arrangement and count changes dynamically (from 3 panels in Split Mode to 2 panels in Code or Visual Mode). Without a unique key, the internal cache gets mismatched, causing resize operations on one divider to incorrectly shift or distort other panels. Forcing a re-render of `PanelGroup` by using the layout mode as a key ensures that the panel positions and defaults are cleanly re-calibrated on every layout switch, offering a fluid and intuitive UX.

## Risks / Trade-offs

- **[Risk] Cursor Jumping in CodeMirror**: When the visual form updates the YAML string, resetting the editor value could make the typing cursor jump to the end of the file.
  - *Mitigation*: The React CodeMirror wrapper only updates the editor view if the incoming `value` prop is different from the editor's current buffer. Since the user is typing in the form, the CodeMirror editor is inactive/blurred, and cursor position is irrelevant. In Split Mode (where both are visible), the cursor only jumps if the user shifts focus. We will wrap updates with a check to verify changes before writing.
- **[Risk] High CPU Overhead during AST parsing**: Large files could lag the UI on every keystroke.
  - *Mitigation*: Typical CV documents are under 300 lines of YAML. Parsing a 300-line document with `yaml` takes less than 1.5 milliseconds. We will apply a tiny 150ms debounce on keystrokes in the form before writing back to the YAML store to keep rendering smooth at 60fps.
