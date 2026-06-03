package http

import (
	"errors"
	"fmt"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"github.com/germainlefebvre4/cvwonder-studio/internal/ports"
	previewUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/preview"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
)

// PDFHandler handles the PDF export endpoint.
type PDFHandler struct {
	getSession   *sessionUC.GetUsecase
	preview      *previewUC.GenerateUsecase
	pdfRenderer  ports.PDFRenderer
	sessionsBase string
}

// NewPDFHandler creates a PDFHandler.
func NewPDFHandler(
	getSession *sessionUC.GetUsecase,
	preview *previewUC.GenerateUsecase,
	pdfRenderer ports.PDFRenderer,
	sessionsBase string,
) *PDFHandler {
	return &PDFHandler{
		getSession:   getSession,
		preview:      preview,
		pdfRenderer:  pdfRenderer,
		sessionsBase: sessionsBase,
	}
}

// ExportPDF handles POST /api/v1/sessions/:token/export/pdf
//
// Flow: load session → generate HTML + assets → render PDF via PDFRenderer → stream bytes.
func (h *PDFHandler) ExportPDF(c *gin.Context) {
	rawToken := c.Param("token")

	// 1. Load session.
	s, err := h.getSession.Execute(c.Request.Context(), rawToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if s == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	// 2. Generate HTML + assets (reuses the same generator as the preview endpoint).
	if _, err := h.preview.ExecuteForSession(c.Request.Context(), rawToken, s.YamlContent, s.ThemeID); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": fmt.Sprintf("HTML generation failed: %s", err.Error())})
		return
	}

	// 3. Render PDF from the generated directory (index.html + all local assets).
	generatedDir := filepath.Join(h.sessionsBase, rawToken, "generated")
	pdfBytes, err := h.pdfRenderer.RenderPDF(c.Request.Context(), generatedDir)
	if err != nil {
		if errors.Is(err, ports.ErrPDFDisabled) {
			c.JSON(http.StatusNotImplemented, gin.H{
				"error":  "PDF export is not available",
				"reason": "no PDF renderer configured",
			})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{
			"error":  "PDF rendering failed",
			"reason": err.Error(),
		})
		return
	}

	// 4. Stream PDF to client.
	c.Header("Content-Disposition", "attachment; filename=\"cv.pdf\"")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}
