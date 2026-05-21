## ADDED Requirements

### Requirement: PDFRenderer port interface
The system SHALL define a `PDFRenderer` interface in `backend/internal/ports/pdf.go` with a single method `RenderPDF(ctx context.Context, html []byte) ([]byte, error)`. All PDF rendering implementations SHALL satisfy this interface.

#### Scenario: Interface satisfied by Gotenberg adapter
- **WHEN** `GOTENBERG_URL` is set to a valid URL at startup
- **THEN** the application SHALL inject a `GotenbergClient` adapter implementing `PDFRenderer`

#### Scenario: Interface satisfied by Null Object when disabled
- **WHEN** `GOTENBERG_URL` is not set at startup
- **THEN** the application SHALL inject a `DisabledRenderer` that implements `PDFRenderer` and always returns `ErrPDFDisabled`

---

### Requirement: Gotenberg HTTP adapter
The system SHALL implement `adapters/gotenberg/client.go` that sends HTML bytes to Gotenberg via `POST /forms/chromium/convert/html` as `multipart/form-data` with a single part named `index.html`.

#### Scenario: Successful PDF rendering
- **WHEN** `RenderPDF` is called with valid HTML bytes and Gotenberg is reachable
- **THEN** the adapter SHALL return the PDF bytes received from Gotenberg with no error

#### Scenario: Gotenberg unreachable
- **WHEN** `RenderPDF` is called and the Gotenberg service cannot be reached
- **THEN** the adapter SHALL return a wrapped error within the configured timeout (default 30 seconds)

#### Scenario: Gotenberg returns non-200 response
- **WHEN** Gotenberg responds with a non-200 HTTP status
- **THEN** the adapter SHALL return an error containing the status code and response body

---

### Requirement: Disabled Null Object renderer
The system SHALL implement `adapters/pdf/disabled.go` as a `DisabledRenderer` struct satisfying `PDFRenderer` that returns a sentinel error `ErrPDFDisabled` on every call without making any network request.

#### Scenario: PDF requested when disabled
- **WHEN** `RenderPDF` is called on `DisabledRenderer`
- **THEN** it SHALL return `nil, ErrPDFDisabled` immediately

---

### Requirement: GOTENBERG_URL configuration
The system SHALL read a `GOTENBERG_URL` environment variable at startup. If the variable is set to a non-empty string, a `GotenbergClient` SHALL be constructed with that base URL. If unset or empty, a `DisabledRenderer` SHALL be used.

#### Scenario: GOTENBERG_URL set to valid address
- **WHEN** `GOTENBERG_URL=http://gotenberg:3000` is present in the environment
- **THEN** the application SHALL use `GotenbergClient` for all PDF rendering requests

#### Scenario: GOTENBERG_URL absent
- **WHEN** `GOTENBERG_URL` is not defined in the environment
- **THEN** the application SHALL use `DisabledRenderer` and PDF export SHALL be unavailable

---

### Requirement: PDF render timeout
The system SHALL enforce a maximum render duration for each `RenderPDF` call. The timeout SHALL default to 30 seconds and SHALL be configurable via a `PDF_RENDER_TIMEOUT` environment variable (value in seconds).

#### Scenario: Render completes within timeout
- **WHEN** Gotenberg returns a response before the deadline
- **THEN** PDF bytes SHALL be returned with no timeout error

#### Scenario: Render exceeds timeout
- **WHEN** Gotenberg does not respond within the configured timeout
- **THEN** the adapter SHALL cancel the request and return a timeout error
