## ADDED Requirements

### Requirement: Generator port interface is defined
The system SHALL define a `ports.Generator` interface in `backend/internal/ports/generator.go`. The interface SHALL have exactly two methods: `GenerateHTML` and `Validate`. PDF generation is explicitly out of scope and SHALL NOT appear in this interface version.

```go
type Generator interface {
    GenerateHTML(ctx context.Context, token, yamlContent, themePath string) (*domain.GenerationResult, error)
    Validate(ctx context.Context, yamlContent string) ([]domain.ValidationError, error)
}
```

#### Scenario: Interface is the only dependency for usecases
- **WHEN** a usecase requires CV generation
- **THEN** it depends only on `ports.Generator`, not on any concrete adapter type

---

### Requirement: Binary adapter implements the Generator port
The system SHALL provide `backend/internal/adapters/cvwonder/binary.go` that implements `ports.Generator` by executing the `cvwonder` binary as a subprocess.

For `GenerateHTML`:
- Write `yamlContent` to a temp file (MUST NOT pass YAML as a CLI argument)
- Execute: `cvwonder generate --input=<tempfile> --theme=<themePath> --format=html --output=sessions/<token>/generated/`
- On success, return `GenerationResult{ OutputDir: "sessions/<token>/generated/" }`
- On non-zero exit, parse stderr and return a wrapped error

For `Validate`:
- Write `yamlContent` to a temp file
- Execute: `cvwonder validate --input=<tempfile> --output=json`
- Parse JSON output into `[]domain.ValidationError`

#### Scenario: HTML is generated successfully
- **WHEN** `GenerateHTML` is called with valid YAML and an existing theme path
- **THEN** `sessions/<token>/generated/cv.html` exists on disk after the call returns

#### Scenario: YAML is never passed as a CLI argument
- **WHEN** `GenerateHTML` is called
- **THEN** the subprocess command does NOT include the YAML content as a flag value (it is always written to a temp file)

#### Scenario: Binary not found returns a clear error
- **WHEN** the cvwonder binary path is not found
- **THEN** `GenerateHTML` returns an error wrapping `exec.ErrNotFound`; the adapter does not panic

#### Scenario: Validation parses errors correctly
- **WHEN** `Validate` is called with YAML that fails schema validation
- **THEN** the returned `[]ValidationError` contains entries with `Field` and `Message` populated

---

### Requirement: Adapter is wired at startup via dependency injection
The binary adapter SHALL be instantiated in `cmd/api/main.go` and injected into the usecases that require it. No usecase SHALL import the adapter package directly.

#### Scenario: Adapter is replaceable without changing usecases
- **WHEN** the `binary.go` adapter is replaced with a future `library.go` adapter
- **THEN** no usecase file needs to change

---

### Requirement: Adapter respects context cancellation and timeout
The subprocess execution SHALL respect the `ctx` context. If the context is cancelled or times out, the subprocess SHALL be killed and the adapter SHALL return a context error.

#### Scenario: Generation respects deadline
- **WHEN** `GenerateHTML` is called with a context that has a 30s deadline and the subprocess runs for longer
- **THEN** the subprocess is killed and the adapter returns `context.DeadlineExceeded`

---

### Requirement: cvwonder binary path is configurable
The binary path SHALL be configurable via the `CVWONDER_BINARY_PATH` environment variable (default: `/usr/local/bin/cvwonder`).

#### Scenario: Custom binary path is used
- **WHEN** `CVWONDER_BINARY_PATH=/opt/cvwonder/bin/cvwonder` is set
- **THEN** the adapter executes that binary instead of the default path

---

### Requirement: Architecture is documented as future-ready for library adapter
The codebase SHALL include a `backend/internal/adapters/cvwonder/library.go.future` stub (or equivalent comment in binary.go) documenting the interface contract for a future native Go implementation. The file SHALL reference the expected cvwonder package paths: `github.com/germainlefebvre4/cvwonder/pkg/parser`, `github.com/germainlefebvre4/cvwonder/pkg/render`, `github.com/germainlefebvre4/cvwonder/pkg/validator`.

#### Scenario: Future adapter stub is present
- **WHEN** a developer opens the adapters/cvwonder/ directory
- **THEN** they can see the intended future import paths and the function signatures to implement
