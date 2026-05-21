package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/germainlefebvre4/cvwonder-studio/db/generated"
	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// ThemeRepository implements ports.ThemeRepository using sqlc + pgx.
type ThemeRepository struct {
	q *db.Queries
}

func NewThemeRepository(pool *pgxpool.Pool) *ThemeRepository {
	return &ThemeRepository{q: db.New(pool)}
}

func (r *ThemeRepository) Upsert(ctx context.Context, t *domain.Theme) (*domain.Theme, error) {
	row, err := r.q.UpsertTheme(ctx, db.UpsertThemeParams{
		ID:        t.ID,
		Name:      t.Name,
		Slug:      t.Slug,
		GithubUrl: t.GithubURL,
		LocalPath: t.LocalPath,
		IsBuiltin: t.IsBuiltin,
	})
	if err != nil {
		return nil, fmt.Errorf("UpsertTheme: %w", err)
	}
	return themeFromDB(row), nil
}

func (r *ThemeRepository) ListActive(ctx context.Context) ([]domain.Theme, error) {
	rows, err := r.q.ListActiveThemes(ctx)
	if err != nil {
		return nil, fmt.Errorf("ListActiveThemes: %w", err)
	}
	themes := make([]domain.Theme, len(rows))
	for i, row := range rows {
		themes[i] = *themeFromDB(row)
	}
	return themes, nil
}

func (r *ThemeRepository) GetBySlug(ctx context.Context, slug string) (*domain.Theme, error) {
	row, err := r.q.GetThemeBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetThemeBySlug: %w", err)
	}
	return themeFromDB(row), nil
}

func (r *ThemeRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Theme, error) {
	row, err := r.q.GetThemeByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetThemeByID: %w", err)
	}
	return themeFromDB(row), nil
}

func themeFromDB(row db.Theme) *domain.Theme {
	return &domain.Theme{
		ID:        row.ID,
		Name:      row.Name,
		Slug:      row.Slug,
		GithubURL: row.GithubUrl,
		LocalPath: row.LocalPath,
		IsBuiltin: row.IsBuiltin,
		DeletedAt: row.DeletedAt,
	}
}
