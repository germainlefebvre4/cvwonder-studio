package ports

import (
	"context"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// Generator is the port for invoking the cvwonder CV generation engine.
// The binary adapter implements this today; a library adapter can replace it
// once cvwonder exposes public Go packages.
type Generator interface {
	// GenerateHTML writes YAML content into an HTML CV in outputDir.
	GenerateHTML(ctx context.Context, yamlContent, themePath, outputDir string) (*domain.GenerationResult, error)

	// Validate validates the YAML content against the cvwonder schema
	// and returns a list of validation errors (empty slice = valid).
	Validate(ctx context.Context, yamlContent string) ([]domain.ValidationError, error)
}
