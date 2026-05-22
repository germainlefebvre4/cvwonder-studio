## ADDED Requirements

### Requirement: Template catalog is embedded in the binary
The system SHALL embed a `catalog.yaml` and individual template YAML files via `go:embed` in the `backend/internal/templates/` package. The catalog SHALL be parsed once at `init()` time and made available via `GetCatalog()` and `GetContent(slug string)` functions. A startup panic SHALL occur if the catalog YAML is malformed.

#### Scenario: Catalog is available at startup
- **WHEN** the binary starts
- **THEN** `GetCatalog()` returns a non-empty slice of `TemplateEntry` without error

#### Scenario: Unknown slug returns empty content
- **WHEN** `GetContent("nonexistent-slug")` is called
- **THEN** the function returns an empty string and no error

---

### Requirement: Template catalog exposes slug, name, description
Each `TemplateEntry` in the catalog SHALL expose at minimum: `slug` (kebab-case identifier), `name` (human-readable label), `description` (one-line summary). The `file` field in `catalog.yaml` SHALL reference the embedded YAML file path relative to the `templates/` package.

#### Scenario: Catalog entries are complete
- **WHEN** `GetCatalog()` is called
- **THEN** every entry has a non-empty `slug`, `name`, and `description`

---

### Requirement: First template set covers five profiles
The initial catalog SHALL include the following templates: `minimal` (structure vide), `developer-fr` (développeur, français), `developer-en` (developer, English), `designer-fr` (designer, français), `devops-fr` (DevOps / platform engineer, français). Each template SHALL be a valid CVWonder YAML document that passes `cvwonder validate`.

#### Scenario: Each template passes validation
- **WHEN** `cvwonder validate` is run against each embedded template file
- **THEN** no validation errors are reported

#### Scenario: Templates contain realistic fictitious content
- **WHEN** the `developer-fr` template is loaded in the studio
- **THEN** the YAML contains plausible name, experience, career entries (not placeholder strings like "TODO")
