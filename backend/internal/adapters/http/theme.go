package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	themeUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/theme"
)

// ThemeHandler handles theme listing.
type ThemeHandler struct {
	list *themeUC.ListUsecase
}

func NewThemeHandler(list *themeUC.ListUsecase) *ThemeHandler {
	return &ThemeHandler{list: list}
}

// GET /api/v1/themes
func (h *ThemeHandler) List(c *gin.Context) {
	themes, err := h.list.Execute(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type themeResponse struct {
		ID        interface{} `json:"id"`
		Name      string      `json:"name"`
		Slug      string      `json:"slug"`
		GithubURL *string     `json:"github_url"`
		IsBuiltin bool        `json:"is_builtin"`
	}

	resp := make([]themeResponse, len(themes))
	for i, t := range themes {
		resp[i] = themeResponse{
			ID:        t.ID,
			Name:      t.Name,
			Slug:      t.Slug,
			GithubURL: t.GithubURL,
			IsBuiltin: t.IsBuiltin,
		}
	}

	c.JSON(http.StatusOK, resp)
}
