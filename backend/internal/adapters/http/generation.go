package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	previewUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/preview"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
	validationUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/validation"
)

// GenerationHandler handles preview and validation endpoints.
type GenerationHandler struct {
	getSession *sessionUC.GetUsecase
	preview    *previewUC.GenerateUsecase
	validate   *validationUC.ValidateUsecase
}

func NewGenerationHandler(
	getSession *sessionUC.GetUsecase,
	preview *previewUC.GenerateUsecase,
	validate *validationUC.ValidateUsecase,
) *GenerationHandler {
	return &GenerationHandler{
		getSession: getSession,
		preview:    preview,
		validate:   validate,
	}
}

// POST /api/v1/sessions/:token/preview
func (h *GenerationHandler) GeneratePreview(c *gin.Context) {
	rawToken := c.Param("token")

	s, err := h.getSession.Execute(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	result, err := h.preview.ExecuteForSession(c.Request.Context(), rawToken, s.YamlContent, s.ThemeID)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"preview_url": result.PreviewURL})
}

// POST /api/v1/sessions/:token/validate
func (h *GenerationHandler) ValidateYaml(c *gin.Context) {
	rawToken := c.Param("token")

	s, err := h.getSession.Execute(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	result, err := h.validate.Execute(c.Request.Context(), s.YamlContent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":  result.Valid,
		"errors": result.Errors,
	})
}
