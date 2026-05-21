package session

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// UpdateUsecase updates a session's yaml content and/or theme.
type UpdateUsecase struct {
	sessions ports.SessionRepository
	themes   ports.ThemeRepository
}

func NewUpdateUsecase(sessions ports.SessionRepository, themes ports.ThemeRepository) *UpdateUsecase {
	return &UpdateUsecase{sessions: sessions, themes: themes}
}

// UpdateInput carries the optional fields to update on a session.
type UpdateInput struct {
	YamlContent *string
	ThemeID     *uuid.UUID
}

// Execute applies the update to the session identified by id.
// If ThemeID is provided, it validates the theme exists first.
func (uc *UpdateUsecase) Execute(ctx context.Context, id uuid.UUID, input UpdateInput) (*domain.Session, error) {
	if input.ThemeID != nil {
		theme, err := uc.themes.GetByID(ctx, *input.ThemeID)
		if err != nil {
			return nil, fmt.Errorf("lookup theme: %w", err)
		}
		if theme == nil {
			return nil, fmt.Errorf("theme not found: %s", input.ThemeID)
		}
	}

	updated, err := uc.sessions.Update(ctx, id, input.YamlContent, input.ThemeID)
	if err != nil {
		return nil, fmt.Errorf("update session: %w", err)
	}
	return updated, nil
}
