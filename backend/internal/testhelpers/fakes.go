package testhelpers
// Package testhelpers provides reusable fake implementations of port interfaces
// for use in unit tests throughout the backend.
package testhelpers

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// ─── FakeSessionRepo ────────────────────────────────────────────────────────

// FakeSessionRepo is an in-memory implementation of ports.SessionRepository.
// Configure its fields before use to control behaviour in each test.
type FakeSessionRepo struct {
	// Sessions maps token-hash → session (set before the test to prime the fake).
	Sessions map[string]*domain.Session

	// InsertedSessions accumulates sessions passed to Insert.
	InsertedSessions []*domain.Session

	// DeletedIDs accumulates IDs passed to Delete.
	DeletedIDs []uuid.UUID

	// DeleteExpiredCalled records whether DeleteExpired was invoked.
	DeleteExpiredCalled bool

	// Err, when non-nil, is returned by every method that returns an error.
	Err error
}

func NewFakeSessionRepo() *FakeSessionRepo {
	return &FakeSessionRepo{Sessions: make(map[string]*domain.Session)}
}

func (f *FakeSessionRepo) Insert(_ context.Context, s *domain.Session) (*domain.Session, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	f.InsertedSessions = append(f.InsertedSessions, s)
	return s, nil
}

func (f *FakeSessionRepo) GetByTokenHash(_ context.Context, tokenHash string) (*domain.Session, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.Sessions[tokenHash], nil
}

func (f *FakeSessionRepo) Update(_ context.Context, id uuid.UUID, yamlContent *string, themeID *uuid.UUID) (*domain.Session, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	for _, s := range f.Sessions {
		if s.ID == id {
			if yamlContent != nil {
				s.YamlContent = *yamlContent
			}
			if themeID != nil {
				s.ThemeID = themeID
			}
			return s, nil
		}
	}
	return nil, nil
}

func (f *FakeSessionRepo) Delete(_ context.Context, id uuid.UUID) error {
	if f.Err != nil {
		return f.Err
	}
	f.DeletedIDs = append(f.DeletedIDs, id)
	return nil
}

func (f *FakeSessionRepo) DeleteExpired(_ context.Context) error {
	f.DeleteExpiredCalled = true
	return f.Err
}

// ─── FakeThemeRepo ──────────────────────────────────────────────────────────

// FakeThemeRepo is an in-memory implementation of ports.ThemeRepository.
type FakeThemeRepo struct {
	// ThemesByID maps UUID → theme.
	ThemesByID map[uuid.UUID]*domain.Theme

	// ThemesBySlug maps slug → theme.
	ThemesBySlug map[string]*domain.Theme

	// UpsertedThemes accumulates themes passed to Upsert.
	UpsertedThemes []*domain.Theme

	// ActiveThemes is returned by ListActive.
	ActiveThemes []domain.Theme

	// Err, when non-nil, is returned by every method.
	Err error
}

func NewFakeThemeRepo() *FakeThemeRepo {
	return &FakeThemeRepo{
		ThemesByID:   make(map[uuid.UUID]*domain.Theme),
		ThemesBySlug: make(map[string]*domain.Theme),
	}
}

func (f *FakeThemeRepo) Upsert(_ context.Context, theme *domain.Theme) (*domain.Theme, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	f.UpsertedThemes = append(f.UpsertedThemes, theme)
	if theme.ID == uuid.Nil {
		theme.ID = uuid.New()
	}
	f.ThemesByID[theme.ID] = theme
	f.ThemesBySlug[theme.Slug] = theme
	return theme, nil
}

func (f *FakeThemeRepo) ListActive(_ context.Context) ([]domain.Theme, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.ActiveThemes, nil
}

func (f *FakeThemeRepo) GetBySlug(_ context.Context, slug string) (*domain.Theme, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.ThemesBySlug[slug], nil
}

func (f *FakeThemeRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Theme, error) {
	if f.Err != nil {
		return nil, f.Err
	}
	return f.ThemesByID[id], nil
}

// ─── FakeGenerator ──────────────────────────────────────────────────────────

// FakeGenerator is an in-memory implementation of ports.Generator.
// By default, GenerateHTML creates an empty index.html in outputDir.
type FakeGenerator struct {
	// GenerateErr, when non-nil, is returned by GenerateHTML.
	GenerateErr error

	// ValidateErrors is returned by Validate.
	ValidateErrors []domain.ValidationError

	// ValidateErr, when non-nil, is returned by Validate.
	ValidateErr error

	// GenerateCalls records (yamlContent, themePath, outputDir) for each call.
	GenerateCalls []GenerateCall
}

type GenerateCall struct {
	YAMLContent string
	ThemePath   string
	OutputDir   string
}

func (f *FakeGenerator) GenerateHTML(_ context.Context, yamlContent, themePath, outputDir string) (*domain.GenerationResult, error) {
	f.GenerateCalls = append(f.GenerateCalls, GenerateCall{
		YAMLContent: yamlContent,
		ThemePath:   themePath,
		OutputDir:   outputDir,
	})
	if f.GenerateErr != nil {
		return nil, f.GenerateErr
	}
	// Create a minimal index.html so callers that check the output dir succeed.
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return nil, fmt.Errorf("fake: create outputDir: %w", err)
	}
	if err := os.WriteFile(filepath.Join(outputDir, "index.html"), []byte("<html></html>"), 0o644); err != nil {
		return nil, fmt.Errorf("fake: write index.html: %w", err)
	}
	return &domain.GenerationResult{OutputDir: outputDir}, nil
}

func (f *FakeGenerator) Validate(_ context.Context, _ string) ([]domain.ValidationError, error) {
	if f.ValidateErr != nil {
		return nil, f.ValidateErr
	}
	return f.ValidateErrors, nil
}
