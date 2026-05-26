package theme_test

import (
	"context"
	"errors"
	"testing"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	themeUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/theme"
)

func TestListUsecase_ReturnsThemesFromRepo(t *testing.T) {
	repo := testhelpers.NewFakeThemeRepo()
	repo.ActiveThemes = []domain.Theme{
		{Slug: "basic", Name: "Basic"},
		{Slug: "default", Name: "Default"},
	}
	uc := themeUC.NewListUsecase(repo)

	themes, err := uc.Execute(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(themes) != 2 {
		t.Errorf("expected 2 themes, got %d", len(themes))
	}
}

func TestListUsecase_RepErrorPropagated(t *testing.T) {
	repo := testhelpers.NewFakeThemeRepo()
	repo.Err = errors.New("db down")
	uc := themeUC.NewListUsecase(repo)

	_, err := uc.Execute(context.Background())
	if err == nil {
		t.Fatal("expected error from repo, got nil")
	}
}
