package validation

import (
	"context"
	"fmt"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
)

// ValidateUsecase runs YAML content through the cvwonder validator.
type ValidateUsecase struct {
	generator ports.Generator
}

func NewValidateUsecase(generator ports.Generator) *ValidateUsecase {
	return &ValidateUsecase{generator: generator}
}

// ValidateResult is the output of a validation run.
type ValidateResult struct {
	Valid  bool
	Errors []domain.ValidationError
}

// Execute validates yamlContent and returns the result.
func (uc *ValidateUsecase) Execute(ctx context.Context, yamlContent string) (*ValidateResult, error) {
	errs, err := uc.generator.Validate(ctx, yamlContent)
	if err != nil {
		return nil, fmt.Errorf("validate: %w", err)
	}
	return &ValidateResult{
		Valid:  len(errs) == 0,
		Errors: errs,
	}, nil
}
