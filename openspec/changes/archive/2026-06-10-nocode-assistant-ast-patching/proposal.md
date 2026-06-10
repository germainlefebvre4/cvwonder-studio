## Why

Current CVWonder Studio is highly accessible to developers who know YAML, but non-technical or casual users are intimidated or slowed down by manual syntax editing. This change introduces an interactive, synchronized No-Code visual editor (Form Wizard) side-by-side with the YAML editor, enabling instantaneous real-time bidirectional synchronization (AST patching) without losing formatting, indentation, or comments.

## What Changes

- Add a responsive dual-mode panel layout ("YAML Editor" / "Visual Assistant" tabs and split-pane layout) to the Studio page.
- Implement real-time, bidirectional state synchronization between the visual form components and the YAML source code.
- Employ the Abstract Syntax Tree (AST) parser (`yaml` package) to patch specific nodes (using `setIn`, `getIn`, and sequences API) on-the-fly, preserving manual comments, custom block ordering, and indentation style.
- Design a robust State/Syntax Guard in Zustand that freezes form synchronization during transient invalid YAML states, preventing the UI from crashing or losing data.
- Ensure full drag-and-drop or reordering support for arrays (careers, technical skills, languages) in the visual form while preserving nested comments.

## Capabilities

### New Capabilities

- `nocode-assistant`: A library of modular form components (personal info, experience, skills, etc.) dynamically bound to the AST, performing real-time surgical updates to the document store.

### Modified Capabilities

- `react-spa`: Adapt the Studio layout to accommodate the Split/Tab visual view, integrate the AST-sync layer in Zustand, and manage error feedback and layout toggles.

## Impact

- **Frontend Dependencies**: Adds `yaml` (v2.x) to `frontend/package.json` for AST manipulation.
- **Frontend Components**:
  - `frontend/src/app/studio/page.tsx`: Integrate layout options, dual rendering, and error status.
  - `frontend/src/store/studio.ts`: Extend state to include AST-sync actions (`setYamlFromCode`, `updateFormField`), error states, and parsed forms data.
  - `frontend/src/components/features/editor/form/*`: Create new folder containing dedicated reactive form sections.
- **Backend**: None. This is a pure frontend enhancement; the JSON/YAML content sent to the backend and previewed via Gotenberg remains unchanged.
