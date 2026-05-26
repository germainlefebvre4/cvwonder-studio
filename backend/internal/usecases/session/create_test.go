package session_test

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
)

// fakeSessionRepo is a minimal in-memory implementation of ports.SessionRepository for tests.
type fakeSessionRepo struct {
	inserted *domain.Session
}

func (f *fakeSessionRepo) Insert(_ context.Context, s *domain.Session) (*domain.Session, error) {
	f.inserted = s
	return s, nil
}
func (f *fakeSessionRepo) GetByTokenHash(_ context.Context, _ string) (*domain.Session, error) {
	return nil, nil
}
func (f *fakeSessionRepo) Update(_ context.Context, _ uuid.UUID, _ *string, _ *uuid.UUID) (*domain.Session, error) {
	return nil, nil
}
func (f *fakeSessionRepo) Delete(_ context.Context, _ uuid.UUID) error { return nil }
func (f *fakeSessionRepo) DeleteExpired(_ context.Context) error       { return nil }

func TestCreateUsecase_NoTemplate(t *testing.T) {
	repo := &fakeSessionRepo{}
	uc := sessionUC.NewCreateUsecase(repo, 7, 24)

	result, err := uc.Execute(context.Background(), nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Session.YamlContent != "" {
		t.Fatalf("expected empty yaml_content, got %q", result.Session.YamlContent)
	}
	if string(result.RawToken) == "" {
		t.Fatal("expected non-empty raw token")
	}
}

func TestCreateUsecase_WithValidTemplate(t *testing.T) {
	repo := &fakeSessionRepo{}
	uc := sessionUC.NewCreateUsecase(repo, 7, 24)

	slug := "minimal"
	result, err := uc.Execute(context.Background(), nil, nil, &slug)
	if err != nil {
		t.Fatalf("unexpected error for known template %q: %v", slug, err)
	}
	if result.Session.YamlContent == "" {
		t.Fatal("expected non-empty yaml_content for template 'minimal'")
	}
}

func TestCreateUsecase_WithUnknownTemplate(t *testing.T) {
	repo := &fakeSessionRepo{}
	uc := sessionUC.NewCreateUsecase(repo, 7, 24)

	slug := "nonexistent-template"
	_, err := uc.Execute(context.Background(), nil, nil, &slug)
	if err == nil {
		t.Fatal("expected error for unknown template slug, got nil")
	}
}

func TestCreateUsecase_WithUserID_LinksSession(t *testing.T) {
	repo := &fakeSessionRepo{}
	uc := sessionUC.NewCreateUsecase(repo, 7, 24)

	userID := uuid.New()
	result, err := uc.Execute(context.Background(), &userID, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Session.UserID == nil {
		t.Fatal("expected UserID to be set on session, got nil")
	}
	if *result.Session.UserID != userID {
		t.Fatalf("expected UserID %v, got %v", userID, *result.Session.UserID)
	}
}

func TestCreateUsecase_Anonymous_UserIDIsNil(t *testing.T) {
	repo := &fakeSessionRepo{}
	uc := sessionUC.NewCreateUsecase(repo, 7, 24)

	result, err := uc.Execute(context.Background(), nil, nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Session.UserID != nil {
		t.Fatalf("expected UserID to be nil for anonymous session, got %v", result.Session.UserID)
	}
}
