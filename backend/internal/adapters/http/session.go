package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/templates"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
)

// SessionHandler handles session CRUD endpoints.
type SessionHandler struct {
	create *sessionUC.CreateUsecase
	get    *sessionUC.GetUsecase
	update *sessionUC.UpdateUsecase
}

func NewSessionHandler(
	create *sessionUC.CreateUsecase,
	get *sessionUC.GetUsecase,
	update *sessionUC.UpdateUsecase,
) *SessionHandler {
	return &SessionHandler{create: create, get: get, update: update}
}

// createSessionRequest is the optional body for POST /api/v1/sessions.
type createSessionRequest struct {
	ThemeID    *uuid.UUID `json:"theme_id"`
	TemplateID *string    `json:"template_id"`
}

// POST /api/v1/sessions
func (h *SessionHandler) Create(c *gin.Context) {
	var req createSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.create.Execute(c.Request.Context(), req.ThemeID, req.TemplateID)
	if err != nil {
		if req.TemplateID != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token":      string(result.RawToken),
		"session_id": result.Session.ID,
		"expires_at": result.Session.ExpiresAt,
	})
}

// GET /api/v1/templates
func (h *SessionHandler) ListTemplates(c *gin.Context) {
	entries := templates.GetCatalog()
	type templateResponse struct {
		Slug        string `json:"slug"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	resp := make([]templateResponse, len(entries))
	for i, e := range entries {
		resp[i] = templateResponse{Slug: e.Slug, Name: e.Name, Description: e.Description}
	}
	c.JSON(http.StatusOK, resp)
}

// GET /api/v1/templates/:slug
func (h *SessionHandler) GetTemplateContent(c *gin.Context) {
	slug := c.Param("slug")
	content := templates.GetContent(slug)
	if content == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "template not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"yaml_content": content})
}

// GET /api/v1/sessions/:token
func (h *SessionHandler) Get(c *gin.Context) {
	rawToken := c.Param("token")
	if rawToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	s, err := h.get.Execute(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id":   s.ID,
		"yaml_content": s.YamlContent,
		"theme_id":     s.ThemeID,
		"expires_at":   s.ExpiresAt,
	})
}

// patchSessionRequest is the body for PATCH /api/v1/sessions/:token.
type patchSessionRequest struct {
	YamlContent *string    `json:"yaml_content"`
	ThemeID     *uuid.UUID `json:"theme_id"`
}

// PATCH /api/v1/sessions/:token
func (h *SessionHandler) Update(c *gin.Context) {
	rawToken := c.Param("token")

	// Resolve the session first so we have its ID.
	s, err := h.get.Execute(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var req patchSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.update.Execute(c.Request.Context(), s.ID, sessionUC.UpdateInput{
		YamlContent: req.YamlContent,
		ThemeID:     req.ThemeID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id":   updated.ID,
		"yaml_content": updated.YamlContent,
		"theme_id":     updated.ThemeID,
		"expires_at":   updated.ExpiresAt,
	})
}
