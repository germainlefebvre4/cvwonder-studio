package ports

import (
	"context"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// SessionRepository is the port for persisting and retrieving sessions.
type SessionRepository interface {
	Insert(ctx context.Context, session *domain.Session) (*domain.Session, error)
	GetByTokenHash(ctx context.Context, tokenHash string) (*domain.Session, error)
	Update(ctx context.Context, id uuid.UUID, yamlContent *string, themeID *uuid.UUID) (*domain.Session, error)
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteExpired(ctx context.Context) error
}

// ThemeRepository is the port for persisting and retrieving themes.
type ThemeRepository interface {
	Upsert(ctx context.Context, theme *domain.Theme) (*domain.Theme, error)
	ListActive(ctx context.Context) ([]domain.Theme, error)
	GetBySlug(ctx context.Context, slug string) (*domain.Theme, error)
	GetByID(ctx context.Context, id uuid.UUID) (*domain.Theme, error)
}

// ConfigRepository is the port for key/value system configuration.
type ConfigRepository interface {
	Get(ctx context.Context, key string) (string, error)
	Upsert(ctx context.Context, key, value string) error
}
