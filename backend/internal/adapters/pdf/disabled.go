package pdf

import (
	"context"

	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// DisabledRenderer is a Null Object implementation of ports.PDFRenderer.
// It is injected when GOTENBERG_URL is not set, so the rest of the application
// never needs nil checks. Every call returns ErrPDFDisabled immediately.
type DisabledRenderer struct{}

// NewDisabledRenderer returns a DisabledRenderer.
func NewDisabledRenderer() *DisabledRenderer {
	return &DisabledRenderer{}
}

// RenderPDF always returns ErrPDFDisabled without making any network request.
func (r *DisabledRenderer) RenderPDF(_ context.Context, _ string) ([]byte, error) {
	return nil, ports.ErrPDFDisabled
}
