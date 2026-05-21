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

// SessionRepository implements ports.SessionRepository using sqlc + pgx.
type SessionRepository struct {
	q *db.Queries
}

func NewSessionRepository(pool *pgxpool.Pool) *SessionRepository {
	return &SessionRepository{q: db.New(pool)}
}

func (r *SessionRepository) Insert(ctx context.Context, s *domain.Session) (*domain.Session, error) {
	row, err := r.q.InsertSession(ctx, db.InsertSessionParams{
		ID:          s.ID,
		TokenHash:   s.TokenHash,
		YamlContent: s.YamlContent,
		ThemeID:     s.ThemeID,
		ExpiresAt:   s.ExpiresAt,
	})
	if err != nil {
		return nil, fmt.Errorf("InsertSession: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error) {
	row, err := r.q.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetSessionByTokenHash: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) Update(ctx context.Context, id uuid.UUID, yamlContent *string, themeID *uuid.UUID) (*domain.Session, error) {
	row, err := r.q.UpdateSession(ctx, db.UpdateSessionParams{
		ID:          id,
		YamlContent: yamlContent,
		ThemeID:     themeID,
	})
	if err != nil {
		return nil, fmt.Errorf("UpdateSession: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteSession(ctx, id)
}

func (r *SessionRepository) DeleteExpired(ctx context.Context) error {
	return r.q.DeleteExpiredSessions(ctx)
}

func sessionFromDB(row db.Session) *domain.Session {
	return &domain.Session{
		ID:          row.ID,
		TokenHash:   row.TokenHash,
		YamlContent: row.YamlContent,
		ThemeID:     row.ThemeID,
		ExpiresAt:   row.ExpiresAt,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
	}
}
