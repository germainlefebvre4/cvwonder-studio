## ADDED Requirements

### Requirement: PDF export endpoint
The system SHALL expose a `POST /api/v1/sessions/:id/export/pdf` endpoint in the Gin server. The endpoint SHALL generate the CV HTML for the given session using `ports.Generator`, then convert it to PDF using `ports.PDFRenderer`, and stream the resulting PDF bytes to the client.

#### Scenario: Successful PDF export
- **WHEN** a client sends `POST /api/v1/sessions/:id/export/pdf` for an existing session
- **THEN** the server SHALL return `200 OK` with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="cv.pdf"`, and the PDF bytes as the response body

#### Scenario: Session not found
- **WHEN** the `:id` in the URL does not correspond to an existing session
- **THEN** the server SHALL return `404 Not Found` with a JSON error body

#### Scenario: PDF renderer disabled
- **WHEN** `GOTENBERG_URL` is not configured and the export endpoint is called
- **THEN** the server SHALL return `501 Not Implemented` with a JSON body `{"error": "PDF export is not available", "reason": "no PDF renderer configured"}`

#### Scenario: Renderer error (Gotenberg unreachable or times out)
- **WHEN** the Gotenberg service is unreachable or returns an error during rendering
- **THEN** the server SHALL return `502 Bad Gateway` with a JSON body describing the rendering error

---

### Requirement: Atomic generate-and-stream flow
The PDF export endpoint SHALL complete the full HTML generation → PDF rendering → response streaming within a single HTTP request. The server SHALL NOT persist the generated PDF to disk or any storage between generation and client delivery.

#### Scenario: PDF streamed directly to client
- **WHEN** Gotenberg returns PDF bytes
- **THEN** the server SHALL begin streaming those bytes to the client immediately without writing to a file

#### Scenario: Pod restart during export
- **WHEN** the pod is terminated while a PDF export is in progress
- **THEN** the in-flight HTTP connection SHALL be closed by the OS; the client SHALL receive a connection error and MAY retry; no partial or corrupt file SHALL be persisted

---

### Requirement: HTML generation reuse for PDF
The PDF export endpoint SHALL reuse the same `ports.Generator` implementation used for HTML preview generation. The generator SHALL produce HTML with self-contained asset references (inlined or absolute URLs) compatible with Gotenberg's Chromium renderer.

#### Scenario: Theme assets resolved
- **WHEN** the generated HTML references theme CSS or image assets
- **THEN** asset URLs in the HTML SHALL be absolute paths or inlined so that Gotenberg can render them without fetching from the studio service
