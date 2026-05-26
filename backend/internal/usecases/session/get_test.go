package session_test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/testhelpers"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
)

func tokenHash(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}

func TestGetUsecase_TokenHashedCorrectly(t *testing.T) {
	rawToken := "my-secret-token"
	expectedHash := tokenHash(rawToken)

	session := &domain.Session{
		ID:        uuid.New(),
		TokenHash: expectedHash,
		ExpiresAt: time.Now().Add(time.Hour),
	}
	repo := testhelpers.NewFakeSessionRepo()
	repo.Sessions[expectedHash] = session

	uc := sessionUC.NewGetUsecase(repo)
	got, err := uc.Execute(context.Background(), rawToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil {
		t.Fatal("expected session, got nil")
	}
	if got.ID != session.ID {
		t.Errorf("got session ID %s, want %s", got.ID, session.ID)
	}
}

func TestGetUsecase_NotFound(t *testing.T) {
	repo := testhelpers.NewFakeSessionRepo()
	uc := sessionUC.NewGetUsecase(repo)

	got, err := uc.Execute(context.Background(), "nonexistent-token")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil session, got %+v", got)
	}
}

func TestGetUsecase_ExpiredSessionDeletedAndReturnsNil(t *testing.T) {
	rawToken := "expired-token"
	hash := tokenHash(rawToken)

	expiredSession := &domain.Session{
		ID:        uuid.New(),
		TokenHash: hash,
		ExpiresAt: time.Now().Add(-time.Hour), // in the past
	}
	repo := testhelpers.NewFakeSessionRepo()
	repo.Sessions[hash] = expiredSession

	uc := sessionUC.NewGetUsecase(repo)
	got, err := uc.Execute(context.Background(), rawToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil for expired session, got %+v", got)
	}
	if len(repo.DeletedIDs) == 0 {
		t.Error("expected Delete to be called for expired session")
	}
	if repo.DeletedIDs[0] != expiredSession.ID {
		t.Errorf("Delete called with ID %s, want %s", repo.DeletedIDs[0], expiredSession.ID)
	}
}

func TestGetUsecase_ValidSessionReturned(t *testing.T) {
	rawToken := "valid-token"
	hash := tokenHash(rawToken)

	session := &domain.Session{
		ID:          uuid.New(),
		TokenHash:   hash,
		YamlContent: "name: Test",
		ExpiresAt:   time.Now().Add(time.Hour),
	}
	repo := testhelpers.NewFakeSessionRepo()
	repo.Sessions[hash] = session

	uc := sessionUC.NewGetUsecase(repo)
	got, err := uc.Execute(context.Background(), rawToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got == nil {
		t.Fatal("expected session, got nil")
	}
	if got.YamlContent != session.YamlContent {
		t.Errorf("YamlContent = %q, want %q", got.YamlContent, session.YamlContent)
	}
}
