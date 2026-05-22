package session

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
	"github.com/germainlefebvre4/cvwonder-studio/internal/templates"
)

// CreateUsecase handles session creation.
type CreateUsecase struct {
	sessions     ports.SessionRepository
	durationDays int
}

func NewCreateUsecase(sessions ports.SessionRepository, durationDays int) *CreateUsecase {
	return &CreateUsecase{sessions: sessions, durationDays: durationDays}
}

// CreateResult is the output of a successful session creation.
type CreateResult struct {
	Session *domain.Session
	// RawToken is returned to the caller exactly once; never stored.
	RawToken domain.Token
}

// Execute creates a new session: generates a random token, hashes it, persists
// the session, and returns both the session and the raw token.
// If templateID is non-nil and matches a known template slug, the session's
// YamlContent is initialised from the embedded template. An unknown slug returns an error.
func (uc *CreateUsecase) Execute(ctx context.Context, themeID *uuid.UUID, templateID *string) (*CreateResult, error) {
	yamlContent := ""
	if templateID != nil {
		content := templates.GetContent(*templateID)
		if content == "" {
			return nil, fmt.Errorf("unknown template: %q", *templateID)
		}
		yamlContent = content
	}

	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return nil, fmt.Errorf("generate token bytes: %w", err)
	}
	rawToken := hex.EncodeToString(rawBytes)

	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	s := &domain.Session{
		ID:          uuid.New(),
		TokenHash:   tokenHash,
		YamlContent: yamlContent,
		ThemeID:     themeID,
		ExpiresAt:   time.Now().UTC().Add(time.Duration(uc.durationDays) * 24 * time.Hour),
	}

	saved, err := uc.sessions.Insert(ctx, s)
	if err != nil {
		return nil, fmt.Errorf("persist session: %w", err)
	}

	return &CreateResult{
		Session:  saved,
		RawToken: domain.Token(rawToken),
	}, nil
}
