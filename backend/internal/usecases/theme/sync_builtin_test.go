package theme_test

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	themeUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/theme"
)

func TestSyncBuiltinUsecase_NonExistentDirIgnored(t *testing.T) {
	repo := testhelpers.NewFakeThemeRepo()
	uc := themeUC.NewSyncBuiltinUsecase(repo, "/nonexistent/themes/dir")

	err := uc.Execute(context.Background())
	if err != nil {
		t.Fatalf("expected nil error for non-existent dir, got %v", err)
	}
	if len(repo.UpsertedThemes) != 0 {
		t.Errorf("expected 0 upserts, got %d", len(repo.UpsertedThemes))
	}
}

func TestSyncBuiltinUsecase_SubdirsUpsertEachAsTheme(t *testing.T) {
	// Create a temp dir with two theme subdirectories.
	themesDir := t.TempDir()
	for _, slug := range []string{"basic", "default"} {
		if err := os.Mkdir(filepath.Join(themesDir, slug), 0o755); err != nil {
			t.Fatal(err)
		}
	}

	repo := testhelpers.NewFakeThemeRepo()
	uc := themeUC.NewSyncBuiltinUsecase(repo, themesDir)

	err := uc.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repo.UpsertedThemes) != 2 {
		t.Errorf("expected 2 upserts (one per slug), got %d", len(repo.UpsertedThemes))
	}
	slugs := map[string]bool{}
	for _, th := range repo.UpsertedThemes {
		slugs[th.Slug] = true
	}
	for _, want := range []string{"basic", "default"} {
		if !slugs[want] {
			t.Errorf("expected slug %q to be upserted", want)
		}
	}
}
