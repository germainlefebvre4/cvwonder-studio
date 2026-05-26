package preview
package preview_test

import (
	"context"
	"os"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	previewUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/preview"
)

func newGenerateUsecase(sessionRepo *testhelpers.FakeSessionRepo, themeRepo *testhelpers.FakeThemeRepo, gen *testhelpers.FakeGenerator, sessionsBase string) *previewUC.GenerateUsecase {
	return previewUC.NewGenerateUsecase(sessionRepo, themeRepo, gen, sessionsBase)
}

func TestExecuteForSession_NilThemeID(t *testing.T) {
	uc := newGenerateUsecase(
		testhelpers.NewFakeSessionRepo(),
		testhelpers.NewFakeThemeRepo(),
		&testhelpers.FakeGenerator{},
		t.TempDir(),
	)
	_, err := uc.ExecuteForSession(context.Background(), "tok", "name: Test", nil)
	if err == nil {
		t.Fatal("expected error for nil themeID")
	}
}

func TestExecuteForSession_ThemeNotFound(t *testing.T) {
	themeRepo := testhelpers.NewFakeThemeRepo() // returns nil for any ID
	uc := newGenerateUsecase(testhelpers.NewFakeSessionRepo(), themeRepo, &testhelpers.FakeGenerator{}, t.TempDir())

	themeID := uuid.New()
	_, err := uc.ExecuteForSession(context.Background(), "tok", "name: Test", &themeID)
	if err == nil {
		t.Fatal("expected error for theme not found")
	}
	if !strings.Contains(err.Error(), "theme not found") {
		t.Errorf("error %q does not contain 'theme not found'", err.Error())
	}
}

func TestExecuteForSession_EmptyLocalPath(t *testing.T) {
	themeRepo := testhelpers.NewFakeThemeRepo()
	themeID := uuid.New()
	themeRepo.ThemesByID[themeID] = &domain.Theme{ID: themeID, Slug: "basic", LocalPath: ""}

	uc := newGenerateUsecase(testhelpers.NewFakeSessionRepo(), themeRepo, &testhelpers.FakeGenerator{}, t.TempDir())
	_, err := uc.ExecuteForSession(context.Background(), "tok", "name: Test", &themeID)
	if err == nil {
		t.Fatal("expected error for empty LocalPath")
	}
	if !strings.Contains(err.Error(), "no local path") {
		t.Errorf("error %q does not contain 'no local path'", err.Error())
	}
}

func TestExecuteForSession_BadDiskPath(t *testing.T) {
	themeRepo := testhelpers.NewFakeThemeRepo()
	themeID := uuid.New()
	themeRepo.ThemesByID[themeID] = &domain.Theme{ID: themeID, Slug: "basic", LocalPath: "/nonexistent/path/to/theme"}

	uc := newGenerateUsecase(testhelpers.NewFakeSessionRepo(), themeRepo, &testhelpers.FakeGenerator{}, t.TempDir())
	_, err := uc.ExecuteForSession(context.Background(), "tok", "name: Test", &themeID)
	if err == nil {
		t.Fatal("expected error for non-existent LocalPath")
	}
	if !strings.Contains(err.Error(), "does not exist") {
		t.Errorf("error %q does not contain 'does not exist'", err.Error())
	}
}

func TestExecuteForSession_HappyPath(t *testing.T) {
	// Create a real temp dir to act as the theme's local path on disk.
	themeDir, err := os.MkdirTemp("", "theme-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(themeDir)

	themeRepo := testhelpers.NewFakeThemeRepo()
	themeID := uuid.New()
	themeRepo.ThemesByID[themeID] = &domain.Theme{ID: themeID, Slug: "basic", LocalPath: themeDir}

	gen := &testhelpers.FakeGenerator{}
	uc := newGenerateUsecase(testhelpers.NewFakeSessionRepo(), themeRepo, gen, t.TempDir())

	rawToken := "abc123"
	result, err := uc.ExecuteForSession(context.Background(), rawToken, "name: Test", &themeID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil result")
	}
	if !strings.Contains(result.PreviewURL, rawToken) {
		t.Errorf("PreviewURL %q does not contain token %q", result.PreviewURL, rawToken)
	}
	if len(gen.GenerateCalls) != 1 {
		t.Errorf("expected 1 GenerateHTML call, got %d", len(gen.GenerateCalls))
	}
}
