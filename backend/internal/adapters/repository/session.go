package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

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
	// Pass empty string when yamlContent is nil; the SQL uses NULLIF('', ...) to
	// treat empty string as "no change".
	yaml := ""
	if yamlContent != nil {
		yaml = *yamlContent
	}
	row, err := r.q.UpdateSession(ctx, db.UpdateSessionParams{
		ID:      id,
		Column2: yaml,
		ThemeID: themeID,
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

func (r *SessionRepository) ClaimAnonymousSession(ctx context.Context, sessionID, userID uuid.UUID) error {
	_, err := r.q.ClaimAnonymousSession(ctx, db.ClaimAnonymousSessionParams{
		ID:     sessionID,
		UserID: &userID,
	})
	return err
}

func (r *SessionRepository) ListAllByUser(ctx context.Context, userID uuid.UUID) ([]*domain.Session, error) {
	rows, err := r.q.ListAllSessionsByUser(ctx, &userID)
	if err != nil {
		return nil, fmt.Errorf("ListAllSessionsByUser: %w", err)
	}
	sessions := make([]*domain.Session, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, sessionFromDB(row))
	}
	return sessions, nil
}

func (r *SessionRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*domain.Session, error) {
	rows, err := r.q.ListSessionsByUser(ctx, &userID)
	if err != nil {
		return nil, fmt.Errorf("ListSessionsByUser: %w", err)
	}
	sessions := make([]*domain.Session, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, sessionFromDB(row))
	}
	return sessions, nil
}

func (r *SessionRepository) ListArchivedByUser(ctx context.Context, userID uuid.UUID) ([]*domain.Session, error) {
	rows, err := r.q.ListArchivedSessionsByUser(ctx, &userID)
	if err != nil {
		return nil, fmt.Errorf("ListArchivedSessionsByUser: %w", err)
	}
	sessions := make([]*domain.Session, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, sessionFromDB(row))
	}
	return sessions, nil
}

func (r *SessionRepository) CountActiveByUser(ctx context.Context, userID uuid.UUID) (int64, error) {
	return r.q.CountActiveSessionsByUser(ctx, &userID)
}

func (r *SessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Session, error) {
	row, err := r.q.GetSessionByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("GetSessionByID: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) UpdateName(ctx context.Context, id uuid.UUID, name string) (*domain.Session, error) {
	row, err := r.q.UpdateSessionName(ctx, db.UpdateSessionNameParams{ID: id, Name: &name})
	if err != nil {
		return nil, fmt.Errorf("UpdateSessionName: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) UpdateTTL(ctx context.Context, id uuid.UUID, expiresAt time.Time) (*domain.Session, error) {
	row, err := r.q.UpdateSessionTTL(ctx, db.UpdateSessionTTLParams{ID: id, ExpiresAt: expiresAt})
	if err != nil {
		return nil, fmt.Errorf("UpdateSessionTTL: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) UpdateTheme(ctx context.Context, id uuid.UUID, themeID *uuid.UUID) (*domain.Session, error) {
	row, err := r.q.UpdateSessionTheme(ctx, db.UpdateSessionThemeParams{ID: id, ThemeID: themeID})
	if err != nil {
		return nil, fmt.Errorf("UpdateSessionTheme: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) Archive(ctx context.Context, id uuid.UUID) (*domain.Session, error) {
	row, err := r.q.ArchiveSession(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("ArchiveSession: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) Restore(ctx context.Context, id uuid.UUID) (*domain.Session, error) {
	row, err := r.q.RestoreSession(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("RestoreSession: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) Duplicate(ctx context.Context, id uuid.UUID, newTokenHash string, expiresAt time.Time) (*domain.Session, error) {
	row, err := r.q.DuplicateSession(ctx, db.DuplicateSessionParams{
		ID:        id,
		TokenHash: newTokenHash,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return nil, fmt.Errorf("DuplicateSession: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) UpdateTags(ctx context.Context, id uuid.UUID, tags []string) (*domain.Session, error) {
	row, err := r.q.UpdateSessionTags(ctx, db.UpdateSessionTagsParams{ID: id, Tags: tags})
	if err != nil {
		return nil, fmt.Errorf("UpdateSessionTags: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) SetShareToken(ctx context.Context, id uuid.UUID, tokenHash string) (*domain.Session, error) {
	row, err := r.q.SetShareToken(ctx, db.SetShareTokenParams{ID: id, ShareTokenHash: &tokenHash})
	if err != nil {
		return nil, fmt.Errorf("SetShareToken: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) RevokeShareToken(ctx context.Context, id uuid.UUID) (*domain.Session, error) {
	row, err := r.q.RevokeShareToken(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("RevokeShareToken: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) SetSharePassword(ctx context.Context, id uuid.UUID, passwordHash string) (*domain.Session, error) {
	row, err := r.q.SetSharePassword(ctx, db.SetSharePasswordParams{ID: id, SharePasswordHash: &passwordHash})
	if err != nil {
		return nil, fmt.Errorf("SetSharePassword: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) GetByShareToken(ctx context.Context, tokenHash string) (*domain.Session, error) {
	row, err := r.q.GetSessionByShareToken(ctx, &tokenHash)
	if err != nil {
		return nil, fmt.Errorf("GetSessionByShareToken: %w", err)
	}
	return sessionFromDB(row), nil
}

func (r *SessionRepository) IncrementViewCount(ctx context.Context, id uuid.UUID) error {
	return r.q.IncrementViewCount(ctx, id)
}

func (r *SessionRepository) UpdateLastGeneratedAt(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.UpdateLastGeneratedAt(ctx, id)
	return err
}

func (r *SessionRepository) PurgeExpiredAnonymous(ctx context.Context) error {
	return r.q.PurgeExpiredAnonymousSessions(ctx)
}

func (r *SessionRepository) PurgeArchivedConnectedContent(ctx context.Context) (int64, error) {
	return r.q.PurgeArchivedConnectedSessionsContent(ctx)
}

func sessionFromDB(row db.Session) *domain.Session {
	return &domain.Session{
		ID:                row.ID,
		TokenHash:         row.TokenHash,
		YamlContent:       row.YamlContent,
		ThemeID:           row.ThemeID,
		ExpiresAt:         row.ExpiresAt,
		CreatedAt:         row.CreatedAt,
		UpdatedAt:         row.UpdatedAt,
		UserID:            row.UserID,
		Name:              row.Name,
		IsArchived:        row.IsArchived,
		ArchivedAt:        row.ArchivedAt,
		ShareTokenHash:    row.ShareTokenHash,
		SharePasswordHash: row.SharePasswordHash,
		LastGeneratedAt:   row.LastGeneratedAt,
		Tags:              row.Tags,
		ViewCount:         row.ViewCount,
		LastViewedAt:      row.LastViewedAt,
	}
}
