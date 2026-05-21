package http

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

// PreviewHandler serves generated CV HTML files with path traversal protection.
type PreviewHandler struct {
	sessionsBase string
}

func NewPreviewHandler(sessionsBase string) *PreviewHandler {
	return &PreviewHandler{sessionsBase: sessionsBase}
}

// ServeFile handles GET /preview/:token/*filepath
func (h *PreviewHandler) ServeFile(c *gin.Context) {
	token := c.Param("token")
	filePath := c.Param("filepath")

	// Sanitize token — must not contain path separators.
	if strings.ContainsAny(token, `/\`) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token"})
		return
	}

	// Build the resolved path and check it is within the allowed base.
	generatedDir := filepath.Join(h.sessionsBase, token, "generated")
	resolvedPath := filepath.Join(generatedDir, filepath.Clean("/"+filePath))

	// Path traversal protection: resolved path must remain under generatedDir.
	if !strings.HasPrefix(resolvedPath, filepath.Clean(generatedDir)+string(filepath.Separator)) &&
		resolvedPath != filepath.Clean(generatedDir) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// Default to index.html when requesting the root.
	if filePath == "/" || filePath == "" {
		resolvedPath = fmt.Sprintf("%s/index.html", generatedDir)
	}

	c.File(resolvedPath)
}
