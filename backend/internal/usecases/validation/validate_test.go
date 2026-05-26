package validation
package validation_test

import (
	"context"
	"errors"
	"testing"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	validationUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/validation"
)

func TestValidateUsecase_ValidYAMLReturnsNoErrors(t *testing.T) {
	gen := &testhelpers.FakeGenerator{ValidateErrors: []domain.ValidationError{}}
	uc := validationUC.NewValidateUsecase(gen)

	result, err := uc.Execute(context.Background(), "name: Test")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.Valid {
		t.Error("expected Valid=true for empty error slice")
	}
	if len(result.Errors) != 0 {
		t.Errorf("expected 0 errors, got %d", len(result.Errors))
	}
}

func TestValidateUsecase_InvalidYAMLSurfacesErrors(t *testing.T) {
	gen := &testhelpers.FakeGenerator{
		ValidateErrors: []domain.ValidationError{
			{Field: "name", Message: "field required"},
		},
	}
	uc := validationUC.NewValidateUsecase(gen)

	result, err := uc.Execute(context.Background(), "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Valid {
		t.Error("expected Valid=false for non-empty errors")
	}
	if len(result.Errors) != 1 || result.Errors[0].Message != "field required" {
		t.Errorf("unexpected errors: %+v", result.Errors)
	}
}

func TestValidateUsecase_GeneratorErrorPropagated(t *testing.T) {
	gen := &testhelpers.FakeGenerator{ValidateErr: errors.New("binary not found")}
	uc := validationUC.NewValidateUsecase(gen)

	_, err := uc.Execute(context.Background(), "name: Test")
	if err == nil {
		t.Fatal("expected error from generator, got nil")
	}
}
