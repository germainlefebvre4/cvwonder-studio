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

// UserRepository provides access to user persistence.
type UserRepository struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{q: db.New(pool), pool: pool}
}

func (r *UserRepository) GetByGoogleSub(ctx context.Context, googleSub string) (*domain.User, error) {
	row, err := r.q.GetUserByGoogleSub(ctx, googleSub)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetUserByGoogleSub: %w", err)
	}
	return userFromDB(row), nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetUserByID: %w", err)
	}
	return userFromDB(row), nil
}

func (r *UserRepository) Create(ctx context.Context, googleSub, email, name, avatarURL string) (*domain.User, error) {
	row, err := r.q.CreateUser(ctx, db.CreateUserParams{
		GoogleSub: googleSub,
		Email:     email,
		Name:      name,
		AvatarUrl: avatarURL,
	})
	if err != nil {
		return nil, fmt.Errorf("CreateUser: %w", err)
	}
	return userFromDB(row), nil
}

func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, email, name, avatarURL string) (*domain.User, error) {
	row, err := r.q.UpdateUser(ctx, db.UpdateUserParams{
		ID:        id,
		Email:     email,
		Name:      name,
		AvatarUrl: avatarURL,
	})
	if err != nil {
		return nil, fmt.Errorf("UpdateUser: %w", err)
	}
	return userFromDB(row), nil
}

func (r *UserRepository) UpdateDefaultTheme(ctx context.Context, id uuid.UUID, themeID *uuid.UUID) (*domain.User, error) {
	row, err := r.q.UpdateUserDefaultTheme(ctx, db.UpdateUserDefaultThemeParams{
		ID:             id,
		DefaultThemeID: themeID,
	})
	if err != nil {
		return nil, fmt.Errorf("UpdateUserDefaultTheme: %w", err)
	}
	return userFromDB(row), nil
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteUser(ctx, id)
}

func (r *UserRepository) GetTags(ctx context.Context, id uuid.UUID) ([]string, error) {
	rows, err := r.q.GetUserTags(ctx, &id)
	if err != nil {
		return nil, fmt.Errorf("GetUserTags: %w", err)
	}
	tags := make([]string, 0, len(rows))
	for _, row := range rows {
		if s, ok := row.(string); ok {
			tags = append(tags, s)
		}
	}
	return tags, nil
}

func userFromDB(row db.User) *domain.User {
	return &domain.User{
		ID:             row.ID,
		GoogleSub:      row.GoogleSub,
		Email:          row.Email,
		Name:           row.Name,
		AvatarURL:      row.AvatarUrl,
		DefaultThemeID: row.DefaultThemeID,
		CreatedAt:      row.CreatedAt,
	}
}
