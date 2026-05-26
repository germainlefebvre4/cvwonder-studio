//go:build integration

package repository_test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

func newSession(tokenRaw string, expiry time.Duration) *domain.Session {
	h := sha256.Sum256([]byte(tokenRaw))
	return &domain.Session{
		ID:          uuid.New(),
		TokenHash:   hex.EncodeToString(h[:]),
		YamlContent: "name: Test",
		ExpiresAt:   time.Now().Add(expiry),
	}
}

func TestSessionRepo_InsertAndGetByTokenHash(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewSessionRepository(testPool)

	s := newSession("token-insert-get", time.Hour)
	inserted, err := repo.Insert(ctx, s)
	if err != nil {
		t.Fatalf("Insert: %v", err)
	}
	if inserted.ID != s.ID {
		t.Errorf("inserted ID = %s, want %s", inserted.ID, s.ID)
	}

	got, err := repo.GetByTokenHash(ctx, s.TokenHash)
	if err != nil {
		t.Fatalf("GetByTokenHash: %v", err)
	}
	if got == nil {
		t.Fatal("expected session, got nil")
	}
	if got.YamlContent != s.YamlContent {
		t.Errorf("YamlContent = %q, want %q", got.YamlContent, s.YamlContent)
	}
}

func TestSessionRepo_GetByTokenHash_UnknownReturnsNil(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewSessionRepository(testPool)

	h := sha256.Sum256([]byte("totally-unknown-token"))
	hash := hex.EncodeToString(h[:])

	got, err := repo.GetByTokenHash(ctx, hash)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil, got %+v", got)
	}
}

func TestSessionRepo_UpdateChangesYamlContent(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewSessionRepository(testPool)

	s := newSession("token-update", time.Hour)
	if _, err := repo.Insert(ctx, s); err != nil {
		t.Fatalf("Insert: %v", err)
	}

	newYAML := "name: Updated"
	if _, err := repo.Update(ctx, s.ID, &newYAML, nil); err != nil {
		t.Fatalf("Update: %v", err)
	}

	got, err := repo.GetByTokenHash(ctx, s.TokenHash)
	if err != nil {
		t.Fatalf("GetByTokenHash: %v", err)
	}
	if got.YamlContent != newYAML {
		t.Errorf("YamlContent = %q, want %q", got.YamlContent, newYAML)
	}
}

func TestSessionRepo_Delete(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewSessionRepository(testPool)

	s := newSession("token-delete", time.Hour)
	if _, err := repo.Insert(ctx, s); err != nil {
		t.Fatalf("Insert: %v", err)
	}

	if err := repo.Delete(ctx, s.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	got, err := repo.GetByTokenHash(ctx, s.TokenHash)
	if err != nil {
		t.Fatalf("GetByTokenHash after delete: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil after delete, got %+v", got)
	}
}

func TestSessionRepo_DeleteExpired(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewSessionRepository(testPool)

	expired := newSession("token-expired-del", -time.Hour)
	active := newSession("token-active-del", time.Hour)

	for _, s := range []*domain.Session{expired, active} {
		if _, err := repo.Insert(ctx, s); err != nil {
			t.Fatalf("Insert %s: %v", s.TokenHash, err)
		}
	}

	if err := repo.DeleteExpired(ctx); err != nil {
		t.Fatalf("DeleteExpired: %v", err)
	}

	if got, _ := repo.GetByTokenHash(ctx, expired.TokenHash); got != nil {
		t.Error("expected expired session to be deleted")
	}
	if got, _ := repo.GetByTokenHash(ctx, active.TokenHash); got == nil {
		t.Error("expected active session to still exist")
	}
}
