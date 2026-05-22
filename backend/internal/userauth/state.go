package userauth

import (
	"crypto/hmac"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"
)

// oauthStatePayload is the content embedded in the oauth_state cookie.
type oauthStatePayload struct {
	Nonce   string `json:"nonce"`
	Exp     int64  `json:"exp"`
	AnonTok string `json:"anon_tok,omitempty"` // optional anon session token for claiming
}

// SignOAuthState creates a signed HMAC state cookie value.
// anonToken is optional — include the raw anon session token to claim it on callback.
func SignOAuthState(secret, anonToken string) (string, error) {
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}
	payload := oauthStatePayload{
		Nonce:   base64.RawURLEncoding.EncodeToString(nonce),
		Exp:     time.Now().Add(5 * time.Minute).Unix(),
		AnonTok: anonToken,
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	encoded := base64.RawURLEncoding.EncodeToString(payloadJSON)
	sig := computeHMAC(secret, encoded)
	return encoded + "." + sig, nil
}

// VerifyOAuthState verifies the state and returns the optional anon token.
func VerifyOAuthState(secret, state string) (anonToken string, err error) {
	lastDot := -1
	for i := len(state) - 1; i >= 0; i-- {
		if state[i] == '.' {
			lastDot = i
			break
		}
	}
	if lastDot < 0 {
		return "", fmt.Errorf("invalid state format")
	}
	message := state[:lastDot]
	sig := state[lastDot+1:]

	expected := computeHMAC(secret, message)
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		return "", fmt.Errorf("invalid state signature")
	}

	payloadJSON, err := base64.RawURLEncoding.DecodeString(message)
	if err != nil {
		return "", fmt.Errorf("decode state: %w", err)
	}
	var p oauthStatePayload
	if err := json.Unmarshal(payloadJSON, &p); err != nil {
		return "", fmt.Errorf("unmarshal state: %w", err)
	}
	if time.Now().Unix() > p.Exp {
		return "", fmt.Errorf("state expired")
	}
	return p.AnonTok, nil
}
