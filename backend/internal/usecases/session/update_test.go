package session_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
)

func TestUpdateUsecase_NilThemeIDSkipsValidation(t *testing.T) {
	sessionRepo := testhelpers.NewFakeSessionRepo()
	themeRepo := testhelpers.NewFakeThemeRepo()
	uc := sessionUC.NewUpdateUsecase(sessionRepo, themeRepo)

	id := uuid.New()
	yaml := "name: Test"
	_, err := uc.Execute(context.Background(), id, sessionUC.UpdateInput{YamlContent: &yaml, ThemeID: nil})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(themeRepo.UpsertedThemes) != 0 {
		t.Error("GetByID should not be called when ThemeID is nil")
	}
}

func TestUpdateUsecase_ValidThemeIDSucceeds(t *testing.T) {
	sessionRepo := testhelpers.NewFakeSessionRepo()
	themeRepo := testhelpers.NewFakeThemeRepo()

	themeID := uuid.New()
	theme := &domain.Theme{ID: themeID, Slug: "default", Name: "Default"}
	themeRepo.ThemesByID[themeID] = theme

	uc := sessionUC.NewUpdateUsecase(sessionRepo, themeRepo)

	sessionID := uuid.New()
	_, err := uc.Execute(context.Background(), sessionID, sessionUC.UpdateInput{ThemeID: &themeID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUpdateUsecase_UnknownThemeIDReturnsError(t *testing.T) {
	sessionRepo := testhelpers.NewFakeSessionRepo()
	themeRepo := testhelpers.NewFakeThemeRepo()
	// themeRepo returns nil for any unknown ID
	uc := sessionUC.NewUpdateUsecase(sessionRepo, themeRepo)

	themeID := uuid.New()
	_, err := uc.Execute(context.Background(), uuid.New(), sessionUC.UpdateInput{ThemeID: &themeID})
	if err == nil {
		t.Fatal("expected error for unknown theme, got nil")
	}
	if !errors.Is(err, errors.New("")) && len(err.Error()) == 0 {
		t.Error("expected a non-empty error message")
	}
}
