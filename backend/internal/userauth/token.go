package userauth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type userTokenPayload struct {
	Sub string `json:"sub"` // user UUID
	Exp int64  `json:"exp"`
}

// SignUserToken creates a signed HMAC-SHA256 user session token valid for ttl.
// Format: base64url(json_payload) + "." + base64url(nonce) + "." + base64url(hmac)
func SignUserToken(secret string, userID uuid.UUID, ttl time.Duration) (string, error) {
	payload := userTokenPayload{Sub: userID.String(), Exp: time.Now().Add(ttl).Unix()}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal token payload: %w", err)
	}
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}
	encoded := base64.RawURLEncoding.EncodeToString(payloadJSON) + "." +
		base64.RawURLEncoding.EncodeToString(nonce)

	sig := computeHMAC(secret, encoded)
	return encoded + "." + sig, nil
}

// VerifyUserToken checks the token and returns the user UUID if valid.
func VerifyUserToken(secret, token string) (uuid.UUID, error) {
	lastDot := -1
	for i := len(token) - 1; i >= 0; i-- {
		if token[i] == '.' {
			lastDot = i
			break
		}
	}
	if lastDot < 0 {
		return uuid.Nil, fmt.Errorf("invalid token format")
	}
	message := token[:lastDot]
	sig := token[lastDot+1:]

	expected := computeHMAC(secret, message)
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return uuid.Nil, fmt.Errorf("invalid token signature")
	}

	firstDot := -1
	for i := 0; i < len(message); i++ {
		if message[i] == '.' {
			firstDot = i
			break
		}
	}
	if firstDot < 0 {
		return uuid.Nil, fmt.Errorf("invalid token structure")
	}
	payloadJSON, err := base64.RawURLEncoding.DecodeString(message[:firstDot])
	if err != nil {
		return uuid.Nil, fmt.Errorf("decode token payload: %w", err)
	}
	var p userTokenPayload
	if err := json.Unmarshal(payloadJSON, &p); err != nil {
		return uuid.Nil, fmt.Errorf("unmarshal token payload: %w", err)
	}
	if time.Now().Unix() > p.Exp {
		return uuid.Nil, fmt.Errorf("token expired")
	}
	id, err := uuid.Parse(p.Sub)
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid user id: %w", err)
	}
	return id, nil
}

func computeHMAC(secret, message string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
