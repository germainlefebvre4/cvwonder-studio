package domain_test

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
)

// ─── IsExpired ────────────────────────────────────────────────────────────────

func TestIsExpired(t *testing.T) {
	now := time.Now()
	cases := []struct {
		name      string
		expiresAt time.Time
		want      bool
	}{
		{"not expired — far future", now.Add(24 * time.Hour), false},
		{"not expired — one second ahead", now.Add(time.Second), false},
		{"expired — one second ago", now.Add(-time.Second), true},
		{"expired — far past", now.Add(-24 * time.Hour), true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := &domain.Session{ExpiresAt: tc.expiresAt}
			if got := s.IsExpired(); got != tc.want {
				t.Errorf("IsExpired() = %v, want %v", got, tc.want)
			}
		})
	}
}

// ─── IsOwner ──────────────────────────────────────────────────────────────────

func TestIsOwner(t *testing.T) {
	ownerID := uuid.New()
	otherID := uuid.New()

	t.Run("matching userID returns true", func(t *testing.T) {
		s := &domain.Session{UserID: &ownerID}
		if !s.IsOwner(ownerID) {
			t.Error("expected IsOwner to return true for matching UUID")
		}
	})

	t.Run("non-matching userID returns false", func(t *testing.T) {
		s := &domain.Session{UserID: &ownerID}
		if s.IsOwner(otherID) {
			t.Error("expected IsOwner to return false for non-matching UUID")
		}
	})

	t.Run("nil UserID returns false without panic", func(t *testing.T) {
		s := &domain.Session{UserID: nil}
		if s.IsOwner(ownerID) {
			t.Error("expected IsOwner to return false when UserID is nil")
		}
	})
}
