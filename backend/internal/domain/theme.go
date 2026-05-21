package domain

import (
	"time"

	"github.com/google/uuid"
)

// Theme represents a CV rendering theme.
type Theme struct {
	ID        uuid.UUID
	Name      string
	Slug      string
	GithubURL *string
	LocalPath string
	IsBuiltin bool
	DeletedAt *time.Time
}
