package domain

import (
	"time"

	"github.com/google/uuid"
)

// Token is the raw bearer token returned to the client on session creation.
// Only the SHA-256 hash is stored in the database.
type Token string

// Session represents an editor session.
type Session struct {
	ID          uuid.UUID
	TokenHash   string
	YamlContent string
	ThemeID     *uuid.UUID
	ExpiresAt   time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	// User-ownership fields (nil = anonymous session)
	UserID            *uuid.UUID
	Name              *string
	IsArchived        bool
	ArchivedAt        *time.Time
	ShareTokenHash    *string
	SharePasswordHash *string
	ShareExpiresAt    *time.Time
	LastGeneratedAt   *time.Time
	Tags              []string
	ViewCount         int32
	LastViewedAt      *time.Time
}

// IsExpired returns true if the session has passed its expiry time.
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsOwner returns true if the given userID owns this session.
func (s *Session) IsOwner(userID uuid.UUID) bool {
	return s.UserID != nil && *s.UserID == userID
}
