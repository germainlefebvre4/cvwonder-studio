package theme

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// SyncBuiltinUsecase upserts bundled themes from THEMES_BUILTIN_DIR into the DB.
type SyncBuiltinUsecase struct {
	themes          ports.ThemeRepository
	themesBuiltinDir string
}

func NewSyncBuiltinUsecase(themes ports.ThemeRepository, themesBuiltinDir string) *SyncBuiltinUsecase {
	return &SyncBuiltinUsecase{themes: themes, themesBuiltinDir: themesBuiltinDir}
}

// Execute enumerates subdirectories of themesBuiltinDir and upserts each as
// a builtin theme (is_builtin=true). The directory name becomes the slug.
func (uc *SyncBuiltinUsecase) Execute(ctx context.Context) error {
	entries, err := os.ReadDir(uc.themesBuiltinDir)
	if err != nil {
		if os.IsNotExist(err) {
			slog.Warn("THEMES_BUILTIN_DIR not found; no builtin themes registered", "dir", uc.themesBuiltinDir)
			return nil
		}
		return fmt.Errorf("read themes dir %s: %w", uc.themesBuiltinDir, err)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		slug := entry.Name()
		localPath := filepath.Join(uc.themesBuiltinDir, slug)

		t := &domain.Theme{
			ID:        uuid.New(),
			Name:      slug,
			Slug:      slug,
			LocalPath: localPath,
			IsBuiltin: true,
		}

		if _, err := uc.themes.Upsert(ctx, t); err != nil {
			slog.Error("failed to upsert builtin theme", "slug", slug, "error", err)
			continue
		}
		slog.Info("builtin theme registered", "slug", slug, "path", localPath)
	}

	return nil
}
