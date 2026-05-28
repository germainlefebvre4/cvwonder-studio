package http

import (
	"archive/zip"
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/domain"
	"github.com/germainlefebvre4/cvwonder-studio/internal/userauth"
)

const defaultMaxSessionsPerUser = 10

// UserSessionHandler handles user-owned session management endpoints.
type UserSessionHandler struct {
	sessions    *repository.SessionRepository
	configRepo  *repository.ConfigRepository
	sessionsDir string
}

func NewUserSessionHandler(sessions *repository.SessionRepository, configRepo *repository.ConfigRepository, sessionsDir string) *UserSessionHandler {
	return &UserSessionHandler{sessions: sessions, configRepo: configRepo, sessionsDir: sessionsDir}
}

// readMaxSessions reads max_sessions_per_user from configRepo; returns defaultMaxSessionsPerUser on error.
func (h *UserSessionHandler) readMaxSessions(c *gin.Context) int64 {
	if h.configRepo != nil {
		if v, err := h.configRepo.Get(c.Request.Context(), "max_sessions_per_user"); err == nil && v != "" {
			if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
				return n
			}
		}
	}
	return defaultMaxSessionsPerUser
}

// sessionResponse is the JSON shape for a user session.
type sessionResponse struct {
	ID              uuid.UUID  `json:"id"`
	Name            *string    `json:"name"`
	ThemeID         *uuid.UUID `json:"theme_id"`
	ExpiresAt       time.Time  `json:"expires_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	IsArchived      bool       `json:"is_archived"`
	ArchivedAt      *time.Time `json:"archived_at"`
	Tags            []string   `json:"tags"`
	ViewCount       int32      `json:"view_count"`
	LastViewedAt    *time.Time `json:"last_viewed_at"`
	HasShareToken   bool       `json:"has_share_token"`
	LastGeneratedAt *time.Time `json:"last_generated_at"`
}

func toSessionResponse(s *domain.Session) sessionResponse {
	return sessionResponse{
		ID:              s.ID,
		Name:            s.Name,
		ThemeID:         s.ThemeID,
		ExpiresAt:       s.ExpiresAt,
		CreatedAt:       s.CreatedAt,
		UpdatedAt:       s.UpdatedAt,
		IsArchived:      s.IsArchived,
		ArchivedAt:      s.ArchivedAt,
		Tags:            s.Tags,
		ViewCount:       s.ViewCount,
		LastViewedAt:    s.LastViewedAt,
		HasShareToken:   s.ShareTokenHash != nil,
		LastGeneratedAt: s.LastGeneratedAt,
	}
}

// GET /api/sessions — list active sessions of authenticated user.
func (h *UserSessionHandler) List(c *gin.Context) {
	userID, ok := userauth.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	archived := c.Query("archived") == "true"
	var sessions []*domain.Session
	var err error
	if archived {
		sessions, err = h.sessions.ListArchivedByUser(c.Request.Context(), userID)
	} else {
		sessions, err = h.sessions.ListByUser(c.Request.Context(), userID)
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	active, err := h.sessions.CountActiveByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	max := h.readMaxSessions(c)

	resp := make([]sessionResponse, 0, len(sessions))
	for _, s := range sessions {
		resp = append(resp, toSessionResponse(s))
	}
	c.JSON(http.StatusOK, gin.H{
		"sessions": resp,
		"total":    len(resp),
		"active":   active,
		"max":      max,
	})
}

// PATCH /api/sessions/:id/name
func (h *UserSessionHandler) RenameSSession(c *gin.Context) {
	userID, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	_ = userID
	var req struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.sessions.UpdateName(c.Request.Context(), session.ID, req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// PATCH /api/sessions/:id/ttl
func (h *UserSessionHandler) UpdateTTL(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	var req struct {
		Days int `json:"days" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Days < 1 || req.Days > 365 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "days must be between 1 and 365"})
		return
	}
	newExpiry := time.Now().UTC().Add(time.Duration(req.Days) * 24 * time.Hour)
	updated, err := h.sessions.UpdateTTL(c.Request.Context(), session.ID, newExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// PATCH /api/sessions/:id/theme
func (h *UserSessionHandler) UpdateTheme(c *gin.Context) {
	userID, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	if session.UserID == nil || *session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "only connected owners can change theme"})
		return
	}
	var req struct {
		ThemeID *uuid.UUID `json:"theme_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := h.sessions.UpdateTheme(c.Request.Context(), session.ID, req.ThemeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// POST /api/sessions/:id/archive
func (h *UserSessionHandler) Archive(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	updated, err := h.sessions.Archive(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// POST /api/sessions/:id/restore
func (h *UserSessionHandler) Restore(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	if session.ArchivedAt != nil && time.Since(*session.ArchivedAt) > 30*24*time.Hour {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "session archived more than 30 days ago, cannot restore"})
		return
	}
	updated, err := h.sessions.Restore(c.Request.Context(), session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// POST /api/sessions/:id/duplicate
func (h *UserSessionHandler) Duplicate(c *gin.Context) {
	userID, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	// Check quota.
	count, err := h.sessions.CountActiveByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	maxSessions := h.readMaxSessions(c)
	if count >= maxSessions {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": fmt.Sprintf("session quota reached (%d/%d)", count, maxSessions)})
		return
	}

	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	rawToken := hex.EncodeToString(rawBytes)
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	expiresAt := time.Now().UTC().Add(30 * 24 * time.Hour)
	dup, err := h.sessions.Duplicate(c.Request.Context(), session.ID, tokenHash, expiresAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"session": toSessionResponse(dup),
		"token":   rawToken,
	})
}

// DELETE /api/sessions/:id
func (h *UserSessionHandler) Delete(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	// Remove filesystem files.
	sessionDir := filepath.Join(h.sessionsDir, session.ID.String())
	_ = os.RemoveAll(sessionDir)

	if err := h.sessions.Delete(c.Request.Context(), session.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// POST /api/sessions/:id/share — generate share token.
func (h *UserSessionHandler) CreateShare(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	rawToken := hex.EncodeToString(rawBytes)
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	if _, err := h.sessions.SetShareToken(c.Request.Context(), session.ID, tokenHash); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Return token only once.
	shareURL := fmt.Sprintf("/s/%s/%s", session.ID, rawToken)
	c.JSON(http.StatusCreated, gin.H{
		"token":     rawToken,
		"share_url": shareURL,
	})
}

// DELETE /api/sessions/:id/share — revoke share token.
func (h *UserSessionHandler) RevokeShare(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	if _, err := h.sessions.RevokeShareToken(c.Request.Context(), session.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// PUT /api/sessions/:id/share/password — set share password.
func (h *UserSessionHandler) SetSharePassword(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}
	if _, err := h.sessions.SetSharePassword(c.Request.Context(), session.ID, string(hash)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// GET /api/sessions/shared/:id/:token — access shared session.
func (h *UserSessionHandler) GetShared(c *gin.Context) {
	rawToken := c.Param("token")
	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	session, err := h.sessions.GetByShareToken(c.Request.Context(), tokenHash)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// Verify session ID matches.
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil || id != session.ID {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// Check password if set.
	if session.SharePasswordHash != nil {
		password := c.GetHeader("X-Share-Password")
		if password == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "password required", "password_protected": true})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(*session.SharePasswordHash), []byte(password)); err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "invalid password"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id":   session.ID,
		"yaml_content": session.YamlContent,
		"theme_id":     session.ThemeID,
		"name":         session.Name,
		"readonly":     true,
	})
}

// GET /api/sessions/:id/export — export session as ZIP.
func (h *UserSessionHandler) Export(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}

	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	// Add YAML.
	yamlFile, err := w.Create("resume.yaml")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	yamlFile.Write([]byte(session.YamlContent))

	// Add HTML if exists.
	htmlPath := filepath.Join(h.sessionsDir, session.ID.String(), "generated", "cv.html")
	if htmlBytes, err := os.ReadFile(htmlPath); err == nil {
		htmlFile, _ := w.Create("cv.html")
		htmlFile.Write(htmlBytes)
	}

	w.Close()

	name := session.ID.String()
	if session.Name != nil && *session.Name != "" {
		name = strings.ReplaceAll(*session.Name, " ", "_")
	}
	filename := fmt.Sprintf("cvwonder-%s.zip", name)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Data(http.StatusOK, "application/zip", buf.Bytes())
}

// PATCH /api/sessions/:id/tags — add or remove a tag.
func (h *UserSessionHandler) UpdateTags(c *gin.Context) {
	_, session, ok := h.resolveOwned(c)
	if !ok {
		return
	}
	var req struct {
		Action string `json:"action" binding:"required"` // "add" or "remove"
		Tag    string `json:"tag" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tagRe := regexp.MustCompile(`^[a-zA-Z0-9_-]{1,30}$`)
	if !tagRe.MatchString(req.Tag) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "tag must be alphanumeric (hyphens/underscores allowed), max 30 chars"})
		return
	}

	tags := session.Tags
	switch req.Action {
	case "add":
		if len(tags) >= 10 {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "maximum 10 tags per session"})
			return
		}
		for _, t := range tags {
			if t == req.Tag {
				c.JSON(http.StatusOK, toSessionResponse(session))
				return
			}
		}
		tags = append(tags, req.Tag)
	case "remove":
		filtered := tags[:0]
		for _, t := range tags {
			if t != req.Tag {
				filtered = append(filtered, t)
			}
		}
		tags = filtered
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "action must be 'add' or 'remove'"})
		return
	}

	updated, err := h.sessions.UpdateTags(c.Request.Context(), session.ID, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toSessionResponse(updated))
}

// GET /p/:id — serve the pre-generated HTML file.
func (h *UserSessionHandler) ServePublic(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	session, err := h.sessions.GetByID(c.Request.Context(), id)
	if err != nil || session == nil || session.IsExpired() {
		c.Redirect(http.StatusFound, "/404-session")
		return
	}

	htmlPath := filepath.Join(h.sessionsDir, id.String(), "generated", "cv.html")
	htmlBytes, err := os.ReadFile(htmlPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "generated HTML not found; please generate first"})
		return
	}

	// Inject viewer bandeau before </body>.
	bandeau := buildBandeau(session)
	html := injectBandeau(string(htmlBytes), bandeau)

	// Count view (non-blocking, exclude owner).
	userID, isAuth := userauth.GetUserID(c)
	isOwner := isAuth && session.UserID != nil && *session.UserID == userID
	if !isOwner && !isBotUserAgent(c.Request.UserAgent()) {
		_ = h.sessions.IncrementViewCount(c.Request.Context(), session.ID)
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

// GET /api/config/limits — public limits endpoint.
func (h *UserSessionHandler) GetLimits(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"anon_session_ttl_hours":                  24,
		"anon_expiry_warn_1_hours":                2,
		"anon_expiry_warn_2_hours":                0.5,
		"session_creation_rate_limit_per_hour":    3,
		"max_yaml_size_kb":                        100,
		"anon_generation_rate_limit_seconds":      5,
		"connected_generation_rate_limit_seconds": 2,
	})
}

// GET /api/sessions/:id — return full session (including yaml_content) to its owner.
func (h *UserSessionHandler) GetSession(c *gin.Context) {
	userID, isAuth := userauth.GetUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	session, err := h.sessions.GetByID(c.Request.Context(), id)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// Return 404 for non-owners to avoid revealing session existence.
	if !isAuth || session.UserID == nil || *session.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           session.ID,
		"name":         session.Name,
		"yaml_content": session.YamlContent,
		"theme_id":     session.ThemeID,
		"expires_at":   session.ExpiresAt,
		"is_archived":  session.IsArchived,
		"created_at":   session.CreatedAt,
		"updated_at":   session.UpdatedAt,
	})
}

// resolveOwned parses the :id param and checks ownership.
func (h *UserSessionHandler) resolveOwned(c *gin.Context) (uuid.UUID, *domain.Session, bool) {
	userID, isAuth := userauth.GetUserID(c)
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return uuid.Nil, nil, false
	}

	session, err := h.sessions.GetByID(c.Request.Context(), id)
	if err != nil || session == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return uuid.Nil, nil, false
	}

	if !isAuth || session.UserID == nil || *session.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return uuid.Nil, nil, false
	}
	return userID, session, true
}

func buildBandeau(_ *domain.Session) string {
	return `<div id="cvwonder-bandeau" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:rgba(0,0,0,0.85);color:#fff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;font-family:sans-serif;font-size:14px;">
  <a href="/" style="color:#fff;font-weight:bold;text-decoration:none;">CVWonder</a>
  <a href="/" style="background:#4f8ef7;color:#fff;padding:6px 16px;border-radius:4px;text-decoration:none;font-weight:bold;">Créer mon CV</a>
</div>`
}

func injectBandeau(html, bandeau string) string {
	idx := strings.LastIndex(html, "</body>")
	if idx < 0 {
		return html + bandeau
	}
	return html[:idx] + bandeau + html[idx:]
}

func isBotUserAgent(ua string) bool {
	bots := []string{"Googlebot", "bingbot", "facebookexternalhit", "Twitterbot", "LinkedInBot", "Slackbot"}
	ua = strings.ToLower(ua)
	for _, bot := range bots {
		if strings.Contains(ua, strings.ToLower(bot)) {
			return true
		}
	}
	return false
}

// Prevent unused import error.
var _ = strconv.Itoa
