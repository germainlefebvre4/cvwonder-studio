package http

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"

	db "github.com/germainlefebvre4/cvwonder-studio/db/generated"
	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/userauth"
)

// AuthHandler handles /api/auth/* routes.
type AuthHandler struct {
	oauthConfig     *oauth2.Config
	users           *repository.UserRepository
	sessions        *repository.SessionRepository
	queries         *db.Queries
	tokenSecret     string
	frontendBaseURL string
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(
	oauthConfig *oauth2.Config,
	users *repository.UserRepository,
	sessions *repository.SessionRepository,
	queries *db.Queries,
	tokenSecret string,
	frontendBaseURL string,
) *AuthHandler {
	return &AuthHandler{
		oauthConfig:     oauthConfig,
		users:           users,
		sessions:        sessions,
		queries:         queries,
		tokenSecret:     tokenSecret,
		frontendBaseURL: frontendBaseURL,
	}
}

// googleUserInfo is the user profile returned by Google's userinfo endpoint.
type googleUserInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// GET /api/auth/login — redirect to Google OAuth with CSRF state cookie.
func (h *AuthHandler) Login(c *gin.Context) {
	if h.oauthConfig == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OAuth not configured"})
		return
	}
	anonTok := c.Query("anon_tok") // optional anonymous session token for claiming
	state, err := userauth.SignOAuthState(h.tokenSecret, anonTok)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate state"})
		return
	}

	// Set state as HttpOnly cookie (5 min).
	c.SetCookie("oauth_state", state, 300, "/", "", false, true)
	url := h.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
	c.Redirect(http.StatusFound, url)
}

// GET /api/auth/callback — handle Google OAuth callback.
func (h *AuthHandler) Callback(c *gin.Context) {
	if h.oauthConfig == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "OAuth not configured"})
		return
	}
	// Verify CSRF state.
	cookieState, err := c.Cookie("oauth_state")
	if err != nil || cookieState == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing oauth state cookie"})
		return
	}
	queryState := c.Query("state")
	if cookieState != queryState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "state mismatch"})
		return
	}
	anonTok, err := userauth.VerifyOAuthState(h.tokenSecret, cookieState)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid oauth state"})
		return
	}
	// Clear state cookie.
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// Exchange code for token.
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing code"})
		return
	}
	token, err := h.oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		slog.Error("oauth exchange failed", "error", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "oauth exchange failed"})
		return
	}

	// Fetch user info from Google.
	client := h.oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user info"})
		return
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read user info"})
		return
	}
	var info googleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse user info"})
		return
	}

	// Upsert user in DB.
	user, err := h.users.GetByGoogleSub(c.Request.Context(), info.Sub)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	if user == nil {
		user, err = h.users.Create(c.Request.Context(), info.Sub, info.Email, info.Name, info.Picture)
	} else {
		user, err = h.users.Update(c.Request.Context(), user.ID, info.Email, info.Name, info.Picture)
	}
	if err != nil {
		slog.Error("upsert user failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upsert user"})
		return
	}

	// Session claiming: if an anon session token was passed, link it to the user.
	if anonTok != "" {
		h.claimAnonSession(c.Request.Context(), user.ID, anonTok)
	}

	// Sign user session cookie (30 days).
	sessionToken, err := userauth.SignUserToken(h.tokenSecret, user.ID, 30*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign session"})
		return
	}
	c.SetCookie("user_session", sessionToken, int((30 * 24 * time.Hour).Seconds()), "/", "", false, true)
	c.Redirect(http.StatusFound, h.frontendBaseURL+"/dashboard")
}

// POST /api/auth/logout — clear the user_session cookie.
func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("user_session", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /api/auth/me — return the authenticated user's profile.
func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, err := h.users.GetByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":               user.ID,
		"email":            user.Email,
		"name":             user.Name,
		"avatar_url":       user.AvatarURL,
		"default_theme_id": user.DefaultThemeID,
		"created_at":       user.CreatedAt,
	})
}

// claimAnonSession links an anonymous session to the newly-authenticated user.
func (h *AuthHandler) claimAnonSession(ctx context.Context, userID uuid.UUID, rawToken string) {
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	session, err := h.sessions.GetByTokenHash(ctx, tokenHash)
	if err != nil || session == nil {
		return
	}
	if session.UserID != nil {
		return // already owned
	}
	if err := h.sessions.ClaimAnonymousSession(ctx, session.ID, userID); err != nil {
		slog.Warn("failed to claim anonymous session", "session_id", session.ID, "error", err)
	}
}

// DELETE /api/auth/account — delete user account and all associated data.
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	if err := h.users.Delete(c.Request.Context(), userID); err != nil {
		slog.Error("delete user failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete account"})
		return
	}
	c.SetCookie("user_session", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// PATCH /api/users/me/default-theme
func (h *AuthHandler) UpdateDefaultTheme(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req struct {
		ThemeID *uuid.UUID `json:"theme_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := h.users.UpdateDefaultTheme(c.Request.Context(), userID, req.ThemeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update default theme"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"default_theme_id": user.DefaultThemeID})
}

// GET /api/users/me/tags
func (h *AuthHandler) GetMyTags(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	tags, err := h.users.GetTags(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"tags": tags})
}

// GET /api/auth/account/export — RGPD data export as JSON (simplified for API).
func (h *AuthHandler) ExportAccount(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, err := h.users.GetByID(c.Request.Context(), userID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	sessions, err := h.sessions.ListAllByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type sessionExport struct {
		ID        string    `json:"id"`
		Name      *string   `json:"name"`
		CreatedAt time.Time `json:"created_at"`
		ExpiresAt time.Time `json:"expires_at"`
		Tags      []string  `json:"tags"`
	}
	sessionList := make([]sessionExport, 0, len(sessions))
	for _, s := range sessions {
		sessionList = append(sessionList, sessionExport{
			ID:        s.ID.String(),
			Name:      s.Name,
			CreatedAt: s.CreatedAt,
			ExpiresAt: s.ExpiresAt,
			Tags:      s.Tags,
		})
	}

	export := gin.H{
		"account": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"name":       user.Name,
			"avatar_url": user.AvatarURL,
			"created_at": user.CreatedAt,
		},
		"sessions": sessionList,
	}

	filename := fmt.Sprintf("cvwonder-export-%s.json", user.ID.String())
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.JSON(http.StatusOK, export)
}
