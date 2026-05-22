package admin

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type tokenPayload struct {
	Sub string `json:"sub"`
	Exp int64  `json:"exp"`
}

// SignToken creates a signed HMAC-SHA256 admin session token valid for ttl.
// Format: base64url(json_payload) + "." + base64url(hmac_sha256(secret, base64url(json_payload)))
func SignToken(secret string, ttl time.Duration) (string, error) {
	payload := tokenPayload{Sub: "admin", Exp: time.Now().Add(ttl).Unix()}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal token payload: %w", err)
	}
	// Add random nonce to prevent reuse of identical tokens.
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}
	encoded := base64.RawURLEncoding.EncodeToString(payloadJSON) + "." +
		base64.RawURLEncoding.EncodeToString(nonce)

	sig := computeHMAC(secret, encoded)
	return encoded + "." + sig, nil
}

// VerifyToken checks that token was signed with secret and has not expired.
func VerifyToken(secret, token string) error {
	// Token: <encoded_payload>.<nonce>.<signature>
	// Split off the last segment as the signature.
	lastDot := -1
	for i := len(token) - 1; i >= 0; i-- {
		if token[i] == '.' {
			lastDot = i
			break
		}
	}
	if lastDot < 0 {
		return fmt.Errorf("invalid token format")
	}
	message := token[:lastDot]
	sig := token[lastDot+1:]

	expected := computeHMAC(secret, message)
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return fmt.Errorf("invalid token signature")
	}

	// Decode and verify expiry.
	parts := splitN(message, ".", 2)
	if len(parts) < 1 {
		return fmt.Errorf("invalid token structure")
	}
	payloadJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return fmt.Errorf("decode token payload: %w", err)
	}
	var p tokenPayload
	if err := json.Unmarshal(payloadJSON, &p); err != nil {
		return fmt.Errorf("unmarshal token payload: %w", err)
	}
	if time.Now().Unix() > p.Exp {
		return fmt.Errorf("token expired")
	}
	if p.Sub != "admin" {
		return fmt.Errorf("invalid token subject")
	}
	return nil
}

// VerifyCredentials checks username and password against the ADMIN_USERNAME and
// ADMIN_PASSWORD_HASH environment variables.
func VerifyCredentials(username, password string) bool {
	expectedUser := os.Getenv("ADMIN_USERNAME")
	expectedHash := os.Getenv("ADMIN_PASSWORD_HASH")
	if username != expectedUser {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(expectedHash), []byte(password))
	return err == nil
}

func computeHMAC(secret, message string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

// splitN splits s by sep up to n parts (like strings.SplitN but returns slice).
func splitN(s, sep string, n int) []string {
	var parts []string
	for i := 0; i < n-1; i++ {
		idx := -1
		for j := 0; j < len(s); j++ {
			if s[j] == sep[0] {
				idx = j
				break
			}
		}
		if idx < 0 {
			break
		}
		parts = append(parts, s[:idx])
		s = s[idx+1:]
	}
	parts = append(parts, s)
	return parts
}
