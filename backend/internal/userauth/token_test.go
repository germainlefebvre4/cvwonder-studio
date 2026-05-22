package userauth_test

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/userauth"
)

const testSecret = "test-secret-for-unit-tests"

func TestSignAndVerifyUserToken(t *testing.T) {
	userID := uuid.New()
	token, err := userauth.SignUserToken(testSecret, userID, time.Hour)
	if err != nil {
		t.Fatalf("SignUserToken: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	gotID, err := userauth.VerifyUserToken(testSecret, token)
	if err != nil {
		t.Fatalf("VerifyUserToken: %v", err)
	}
	if gotID != userID {
		t.Fatalf("expected userID %s, got %s", userID, gotID)
	}
}

func TestVerifyUserToken_InvalidSecret(t *testing.T) {
	userID := uuid.New()
	token, err := userauth.SignUserToken(testSecret, userID, time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	_, err = userauth.VerifyUserToken("wrong-secret", token)
	if err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestVerifyUserToken_Expired(t *testing.T) {
	userID := uuid.New()
	// Sign with -1 minute TTL → immediately expired.
	token, err := userauth.SignUserToken(testSecret, userID, -time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	_, err = userauth.VerifyUserToken(testSecret, token)
	if err == nil {
		t.Fatal("expected error for expired token")
	}
}

func TestSignAndVerifyOAuthState(t *testing.T) {
	state, err := userauth.SignOAuthState(testSecret, "anon-token-123")
	if err != nil {
		t.Fatalf("SignOAuthState: %v", err)
	}

	anonTok, err := userauth.VerifyOAuthState(testSecret, state)
	if err != nil {
		t.Fatalf("VerifyOAuthState: %v", err)
	}
	if anonTok != "anon-token-123" {
		t.Fatalf("expected anon-token-123, got %q", anonTok)
	}
}

func TestVerifyOAuthState_InvalidSignature(t *testing.T) {
	state, err := userauth.SignOAuthState(testSecret, "")
	if err != nil {
		t.Fatal(err)
	}
	_, err = userauth.VerifyOAuthState("wrong-secret", state)
	if err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestVerifyOAuthState_EmptyAnonToken(t *testing.T) {
	state, err := userauth.SignOAuthState(testSecret, "")
	if err != nil {
		t.Fatal(err)
	}
	anonTok, err := userauth.VerifyOAuthState(testSecret, state)
	if err != nil {
		t.Fatalf("VerifyOAuthState: %v", err)
	}
	if anonTok != "" {
		t.Fatalf("expected empty anon token, got %q", anonTok)
	}
}
