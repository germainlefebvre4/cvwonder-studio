package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents an authenticated end-user.
type User struct {
	ID             uuid.UUID
	GoogleSub      string
	Email          string
	Name           string
	AvatarURL      string
	DefaultThemeID *uuid.UUID
	CreatedAt      time.Time
}
