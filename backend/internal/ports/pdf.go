package ports

import (
	"context"
	"errors"
)

// ErrPDFDisabled is returned by DisabledRenderer when no PDF renderer is configured.
var ErrPDFDisabled = errors.New("PDF rendering is disabled: no PDF renderer configured")

// PDFRenderer is the port for converting a generated CV directory to a PDF document.
// The generatedDir contains index.html plus any CSS/asset files produced by the generator.
// Implementations include GotenbergClient (HTTP adapter) and DisabledRenderer (Null Object).
type PDFRenderer interface {
	// RenderPDF takes the path to the generated CV directory (containing index.html
	// and associated assets) and returns the resulting PDF bytes.
	RenderPDF(ctx context.Context, generatedDir string) ([]byte, error)
}
