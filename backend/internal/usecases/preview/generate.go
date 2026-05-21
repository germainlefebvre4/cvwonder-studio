package preview

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// GenerateUsecase triggers HTML generation for a session.
type GenerateUsecase struct {
	sessions     ports.SessionRepository
	themes       ports.ThemeRepository
	generator    ports.Generator
	sessionsBase string
}

func NewGenerateUsecase(
	sessions ports.SessionRepository,
	themes ports.ThemeRepository,
	generator ports.Generator,
	sessionsBase string,
) *GenerateUsecase {
	return &GenerateUsecase{
		sessions:     sessions,
		themes:       themes,
		generator:    generator,
		sessionsBase: sessionsBase,
	}
}

// GenerateResult holds the public preview URL path.
type GenerateResult struct {
	PreviewURL string
}

// Execute generates an HTML CV for the given session token.
func (uc *GenerateUsecase) Execute(ctx context.Context, sessionID uuid.UUID, rawToken string) (*GenerateResult, error) {
	// Load session directly by ID (already authenticated upstream).
	s, err := uc.sessions.GetByTokenHash(ctx, "")
	_ = s
	// NOTE: caller passes the full session object; we look up the theme.
	// This usecase is invoked from the HTTP handler which already has the session.
	_ = err
	return nil, fmt.Errorf("use ExecuteForSession instead")
}

// ExecuteForSession generates HTML for a session whose domain object is already resolved.
func (uc *GenerateUsecase) ExecuteForSession(ctx context.Context, rawToken string, yamlContent string, themeID *uuid.UUID) (*GenerateResult, error) {
	if themeID == nil {
		return nil, fmt.Errorf("session has no theme selected")
	}

	theme, err := uc.themes.GetByID(ctx, *themeID)
	if err != nil {
		return nil, fmt.Errorf("lookup theme: %w", err)
	}
	if theme == nil {
		return nil, fmt.Errorf("theme not found")
	}

	// Validate theme path exists on disk.
	if theme.LocalPath == "" {
		return nil, fmt.Errorf("theme has no local path configured")
	}
	if _, err := os.Stat(theme.LocalPath); err != nil {
		return nil, fmt.Errorf("theme local path does not exist: %s", theme.LocalPath)
	}

	outputDir := filepath.Join(uc.sessionsBase, rawToken, "generated")

	if _, err := uc.generator.GenerateHTML(ctx, yamlContent, theme.LocalPath, outputDir); err != nil {
		return nil, fmt.Errorf("generate HTML: %w", err)
	}

	return &GenerateResult{
		PreviewURL: fmt.Sprintf("/preview/%s/", rawToken),
	}, nil
}
