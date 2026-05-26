//go:build integration

package repository_test

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

func TestThemeRepo_UpsertCreatesNewTheme(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewThemeRepository(testPool)

	theme := &domain.Theme{
		ID:        uuid.New(),
		Name:      "Basic",
		Slug:      "basic-" + uuid.New().String()[:8], // unique slug per run
		LocalPath: "/themes/basic",
		IsBuiltin: true,
	}

	upserted, err := repo.Upsert(ctx, theme)
	if err != nil {
		t.Fatalf("Upsert: %v", err)
	}
	if upserted.ID != theme.ID {
		t.Errorf("ID = %s, want %s", upserted.ID, theme.ID)
	}

	got, err := repo.GetBySlug(ctx, theme.Slug)
	if err != nil {
		t.Fatalf("GetBySlug: %v", err)
	}
	if got == nil {
		t.Fatal("expected theme, got nil")
	}
	if got.Name != theme.Name {
		t.Errorf("Name = %q, want %q", got.Name, theme.Name)
	}
}

func TestThemeRepo_UpsertUpdatesExistingTheme(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewThemeRepository(testPool)

	slug := "update-" + uuid.New().String()[:8]
	theme := &domain.Theme{ID: uuid.New(), Name: "Original", Slug: slug, LocalPath: "/themes/x", IsBuiltin: true}
	if _, err := repo.Upsert(ctx, theme); err != nil {
		t.Fatalf("first Upsert: %v", err)
	}

	theme.Name = "Updated"
	if _, err := repo.Upsert(ctx, theme); err != nil {
		t.Fatalf("second Upsert: %v", err)
	}

	got, err := repo.GetBySlug(ctx, slug)
	if err != nil {
		t.Fatalf("GetBySlug: %v", err)
	}
	if got.Name != "Updated" {
		t.Errorf("Name = %q, want 'Updated'", got.Name)
	}
}

func TestThemeRepo_ListActive(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewThemeRepository(testPool)

	slug := "list-active-" + uuid.New().String()[:8]
	theme := &domain.Theme{ID: uuid.New(), Name: "Active Theme", Slug: slug, LocalPath: "/themes/x", IsBuiltin: true}
	if _, err := repo.Upsert(ctx, theme); err != nil {
		t.Fatalf("Upsert: %v", err)
	}

	themes, err := repo.ListActive(ctx)
	if err != nil {
		t.Fatalf("ListActive: %v", err)
	}

	found := false
	for _, th := range themes {
		if th.Slug == slug {
			found = true
		}
	}
	if !found {
		t.Errorf("expected slug %q in ListActive result", slug)
	}
}

func TestThemeRepo_GetByID(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewThemeRepository(testPool)

	id := uuid.New()
	slug := "byid-" + id.String()[:8]
	theme := &domain.Theme{ID: id, Name: "ByID Theme", Slug: slug, LocalPath: "/themes/x", IsBuiltin: true}
	if _, err := repo.Upsert(ctx, theme); err != nil {
		t.Fatalf("Upsert: %v", err)
	}

	got, err := repo.GetByID(ctx, id)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got == nil {
		t.Fatal("expected theme, got nil")
	}
	if got.Slug != slug {
		t.Errorf("Slug = %q, want %q", got.Slug, slug)
	}
}

func TestThemeRepo_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewThemeRepository(testPool)

	got, err := repo.GetByID(ctx, uuid.New())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil for unknown ID, got %+v", got)
	}
}
