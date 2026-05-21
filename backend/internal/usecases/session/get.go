package session

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// GetUsecase retrieves a session by raw token.
type GetUsecase struct {
	sessions ports.SessionRepository
}

func NewGetUsecase(sessions ports.SessionRepository) *GetUsecase {
	return &GetUsecase{sessions: sessions}
}

// Execute looks up a session by its raw token. Returns nil if not found.
// Expired sessions are deleted on access and treated as not found.
func (uc *GetUsecase) Execute(ctx context.Context, rawToken string) (*domain.Session, error) {
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	s, err := uc.sessions.GetByTokenHash(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("get session: %w", err)
	}
	if s == nil {
		return nil, nil
	}

	if s.IsExpired() {
		if delErr := uc.sessions.Delete(ctx, s.ID); delErr != nil {
			// Log but don't fail — treat as not found.
			_ = delErr
		}
		return nil, nil
	}

	return s, nil
}
