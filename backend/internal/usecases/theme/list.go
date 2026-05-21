package theme

import (
	"context"
	"fmt"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// ListUsecase returns all active themes.
type ListUsecase struct {
	themes ports.ThemeRepository
}

func NewListUsecase(themes ports.ThemeRepository) *ListUsecase {
	return &ListUsecase{themes: themes}
}

// Execute returns all non-deleted themes.
func (uc *ListUsecase) Execute(ctx context.Context) ([]domain.Theme, error) {
	themes, err := uc.themes.ListActive(ctx)
	if err != nil {
		return nil, fmt.Errorf("list themes: %w", err)
	}
	return themes, nil
}
