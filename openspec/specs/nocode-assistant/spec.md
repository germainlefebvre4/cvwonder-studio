# nocode-assistant Specification

## Purpose
TBD - created by archiving change nocode-assistant-ast-patching. Update Purpose after archive.
## Requirements
### Requirement: Interactive visual form wizard
The system SHALL provide a form-based visual editing wizard (No-Code Assistant) consisting of collapsible, styled accordion sections mapped to the CV JSON schema: Personal Info, Social Networks, Abstract, Career History, Technical Skills, Side Projects, Certifications, Languages, and Education.

#### Scenario: Sections are mapped to the CV schema
- **WHEN** the user opens the Visual Assistant
- **THEN** they see sections corresponding to Personal Info, Career, Technical Skills, and other schema categories

#### Scenario: Visual inputs render current YAML state
- **WHEN** the session loads with pre-filled YAML
- **THEN** all visual form inputs are populated with the correct values parsed from the YAML document

---

### Requirement: Real-time AST-based bidirectional synchronization
The system SHALL synchronize edits in the visual form to the YAML document, and edits in the YAML document to the visual form, in real-time. This synchronization SHALL use the `yaml` library to manipulate the Abstract Syntax Tree (AST) using target node operations (`setIn`, `getIn`, sequences, maps). It SHALL NOT erase or alter comments, block ordering, or indentation styles present in the YAML code.

#### Scenario: Visual input edit updates YAML code
- **WHEN** the user edits a text input (e.g., changing "Germain" to "Germain Lefebvre") in the visual form
- **THEN** the corresponding node in the YAML document is updated instantly, and comments surrounding the element are fully preserved

#### Scenario: Code change updates visual form
- **WHEN** the user type-edits a value in the YAML editor
- **THEN** the parsed state is updated, and the corresponding input in the visual form reflects the change after debounce

---

### Requirement: Graceful handling of invalid YAML syntax
The system SHALL handle invalid YAML syntax in the code editor gracefully. If the YAML document becomes syntax-invalid, the visual form SHALL freeze its synchronization (locking its state to the last known valid state) and SHALL display a prominent inline warning banner informing the user that the form is read-only until the syntax error is fixed.

#### Scenario: Typing invalid YAML freezes form with alert
- **WHEN** the user types invalid YAML syntax (e.g., an unindented line or missing colon)
- **THEN** the form elements are temporarily disabled and a banner "YAML Syntax Error: Visual editing suspended" is displayed

#### Scenario: Correcting syntax restores form reactivity
- **WHEN** the user corrects the syntax error in the YAML editor
- **THEN** the warning banner disappears, form elements are re-enabled, and sync resumes with the updated state

---

### Requirement: Visual list manipulation for arrays
The array-based sections in the visual form (Career, Skills, Projects, Languages, etc.) SHALL support adding, deleting, and reordering elements. The form SHALL delegate these actions to the Zustand store, which SHALL perform sequence AST patching (e.g., appending nodes, splice, deleteIn) to preserve comments of nested and adjacent elements.

#### Scenario: Adding a career entry updates YAML sequence
- **WHEN** the user clicks "Ajouter une expérience" in the visual Career form
- **THEN** a new list item with default properties is appended to the YAML sequence, and a new sub-form accordion section is appended

#### Scenario: Deleting a skill domain deletes YAML block
- **WHEN** the user clicks the "Supprimer" button on a skill domain
- **THEN** the corresponding index is removed from the AST sequence, and the YAML document updates instantly without affecting other categories

