package admin

import (
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/germainlefebvre4/cvwonder-studio/db/generated"
	"github.com/germainlefebvre4/cvwonder-studio/internal/config"
)

// AdminDeps contains all dependencies needed by the admin handler.
type AdminDeps struct {
	Queries     *db.Queries
	Pool        *pgxpool.Pool
	Config      *config.Config
	TokenSecret string
}

// Handler holds all admin HTTP handler methods.
type Handler struct {
	AdminDeps
}

// NewHandler creates a new admin Handler.
func NewHandler(deps AdminDeps) *Handler {
	return &Handler{AdminDeps: deps}
}

// RegisterRoutes registers all admin routes on r.
// Login and logout are public; all other /api/admin/* routes are protected by
// the RequireAdmin middleware.
func RegisterRoutes(r *gin.Engine, deps AdminDeps) {
	h := NewHandler(deps)

	// Public admin endpoints (no auth).
	r.POST("/api/admin/login", h.Login)
	r.POST("/api/admin/logout", h.Logout)

	// Protected admin group.
	protected := r.Group("/api/admin", RequireAdmin(deps.TokenSecret))
	{
		// Theme management.
		protected.GET("/themes", h.ListThemes)
		protected.POST("/themes/install", h.InstallTheme)
		protected.POST("/themes/:slug/check-updates", h.CheckUpdates)
		protected.DELETE("/themes/:slug", h.DeleteTheme)

		// Catalog.
		protected.GET("/catalog", h.GetCatalog)
		protected.GET("/catalog/:slug/versions", h.GetCatalogVersions)

		// Session management.
		protected.GET("/sessions", h.ListSessions)
		protected.POST("/sessions/:id/expire", h.ExpireSession)
		protected.DELETE("/sessions/:id", h.DeleteSession)
		protected.POST("/sessions/purge", h.PurgeSessions)

		// System / dashboard.
		protected.GET("/dashboard", h.Dashboard)
		protected.GET("/system/health", h.SystemHealth)
	}
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth handlers (tasks 4.4, 4.5)
// ──────────────────────────────────────────────────────────────────────────────

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// POST /api/admin/login
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}
	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}
	if !VerifyCredentials(req.Username, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	token, err := SignToken(h.TokenSecret, 8*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create session"})
		return
	}
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("admin_session", token, int((8 * time.Hour).Seconds()), "/", "", true, true)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// POST /api/admin/logout
func (h *Handler) Logout(c *gin.Context) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("admin_session", "", 0, "/", "", true, true)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ──────────────────────────────────────────────────────────────────────────────
// Theme handlers (tasks 5.1–5.6)
// ──────────────────────────────────────────────────────────────────────────────

// GET /api/admin/themes
func (h *Handler) ListThemes(c *gin.Context) {
	themes, err := h.Queries.ListThemesAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, themes)
}

// catalogThemeResponse merges a catalog entry with its DB installed state.
type catalogThemeResponse struct {
	Slug         string  `json:"slug"`
	Name         string  `json:"name"`
	Repo         string  `json:"repo"`
	Installed    bool    `json:"installed"`
	InstalledRef *string `json:"installed_ref,omitempty"`
}

// GET /api/admin/catalog
func (h *Handler) GetCatalog(c *gin.Context) {
	catalog := GetCatalog()
	themes, err := h.Queries.ListThemesAdmin(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	themeBySlug := make(map[string]db.Theme, len(themes))
	for _, t := range themes {
		themeBySlug[t.Slug] = t
	}

	resp := make([]catalogThemeResponse, len(catalog))
	for i, entry := range catalog {
		r := catalogThemeResponse{
			Slug: entry.Slug,
			Name: entry.Name,
			Repo: entry.Repo,
		}
		if t, ok := themeBySlug[entry.Slug]; ok {
			r.Installed = true
			r.InstalledRef = t.InstalledRef
		}
		resp[i] = r
	}
	c.JSON(http.StatusOK, resp)
}

// GET /api/admin/catalog/:slug/versions
func (h *Handler) GetCatalogVersions(c *gin.Context) {
	slug := c.Param("slug")
	entry := GetCatalogEntry(slug)
	if entry == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "catalog entry not found"})
		return
	}
	parts := strings.SplitN(entry.Repo, "/", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid repo format"})
		return
	}
	versions, err := ListVersions(parts[0], parts[1])
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, versions)
}

type installRequest struct {
	Slug string `json:"slug"`
	Ref  string `json:"ref"`
}

// POST /api/admin/themes/install
func (h *Handler) InstallTheme(c *gin.Context) {
	var req installRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Slug == "" || req.Ref == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug and ref are required"})
		return
	}
	entry := GetCatalogEntry(req.Slug)
	if entry == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "catalog entry not found"})
		return
	}
	parts := strings.SplitN(entry.Repo, "/", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid repo format"})
		return
	}

	destDir := filepath.Join(h.Config.ThemesRuntimeDir, req.Slug)
	if err := DownloadAndExtract(parts[0], parts[1], req.Ref, destDir); err != nil {
		if errors.Is(err, ErrPathTraversal) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "zip contains path traversal entry"})
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("github download: %s", err.Error())})
		return
	}

	ref := req.Ref
	theme, err := h.Queries.UpsertTheme(c.Request.Context(), db.UpsertThemeParams{
		ID:        uuid.New(),
		Name:      entry.Name,
		Slug:      entry.Slug,
		GithubUrl: &entry.Repo,
		LocalPath: destDir,
		IsBuiltin: false,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	theme, err = h.Queries.UpdateInstalledRef(c.Request.Context(), db.UpdateInstalledRefParams{
		Slug:         theme.Slug,
		InstalledRef: &ref,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, theme)
}

// POST /api/admin/themes/:slug/check-updates
func (h *Handler) CheckUpdates(c *gin.Context) {
	slug := c.Param("slug")
	theme, err := h.Queries.GetThemeBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "theme not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	entry := GetCatalogEntry(slug)
	if entry == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "theme not in catalog"})
		return
	}
	parts := strings.SplitN(entry.Repo, "/", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid repo format"})
		return
	}

	versions, err := ListVersions(parts[0], parts[1])
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}

	var latestRef string
	if len(versions) > 0 {
		latestRef = versions[0].Ref
	}

	updated, err := h.Queries.UpdateLatestRef(c.Request.Context(), db.UpdateLatestRefParams{
		Slug:      slug,
		LatestRef: &latestRef,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updateAvailable := updated.InstalledRef != nil && updated.LatestRef != nil &&
		*updated.InstalledRef != *updated.LatestRef

	c.JSON(http.StatusOK, gin.H{
		"installed_ref":    theme.InstalledRef,
		"latest_ref":       updated.LatestRef,
		"update_available": updateAvailable,
	})
}

// DELETE /api/admin/themes/:slug
func (h *Handler) DeleteTheme(c *gin.Context) {
	slug := c.Param("slug")
	theme, err := h.Queries.GetThemeBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "theme not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if theme.IsBuiltin {
		c.JSON(http.StatusForbidden, gin.H{"error": "builtin themes cannot be deleted"})
		return
	}
	n, err := h.Queries.SoftDeleteTheme(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "theme not found"})
		return
	}
	c.Status(http.StatusNoContent)
}

// ──────────────────────────────────────────────────────────────────────────────
// Session handlers (tasks 6.1–6.4)
// ──────────────────────────────────────────────────────────────────────────────

type sessionAdminResponse struct {
	db.Session
	IsExpired bool `json:"is_expired"`
}

type paginatedSessions struct {
	Items      []sessionAdminResponse `json:"items"`
	Page       int                    `json:"page"`
	PerPage    int                    `json:"per_page"`
	TotalItems int64                  `json:"total_items"`
	TotalPages int                    `json:"total_pages"`
}

// GET /api/admin/sessions
func (h *Handler) ListSessions(c *gin.Context) {
	page := queryInt(c, "page", 1)
	perPage := queryInt(c, "per_page", 25)
	if perPage > 100 {
		perPage = 100
	}
	q := c.Query("q")
	now := time.Now()

	total, err := h.Queries.CountSessions(c.Request.Context(), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sessions, err := h.Queries.ListSessionsAdmin(c.Request.Context(), db.ListSessionsAdminParams{
		Column1: q,
		Limit:   int32(perPage),
		Offset:  int32((page - 1) * perPage),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	items := make([]sessionAdminResponse, len(sessions))
	for i, s := range sessions {
		items[i] = sessionAdminResponse{Session: s, IsExpired: s.ExpiresAt.Before(now)}
	}

	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, paginatedSessions{
		Items:      items,
		Page:       page,
		PerPage:    perPage,
		TotalItems: total,
		TotalPages: totalPages,
	})
}

// POST /api/admin/sessions/:id/expire
func (h *Handler) ExpireSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}
	n, err := h.Queries.ForceExpireSession(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if n == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DELETE /api/admin/sessions/:id
func (h *Handler) DeleteSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}
	// Check existence first (DeleteSession is :exec and doesn't report rows affected).
	_, err = h.Queries.GetSessionByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := h.Queries.DeleteSession(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// POST /api/admin/sessions/purge
func (h *Handler) PurgeSessions(c *gin.Context) {
	count, err := h.Queries.CountAndDeleteExpiredSessions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted_count": count})
}

// ──────────────────────────────────────────────────────────────────────────────
// System handlers (tasks 7.1, 7.2)
// ──────────────────────────────────────────────────────────────────────────────

type dashboardResponse struct {
	Sessions struct {
		Active       int64 `json:"active"`
		ExpiringSoon int64 `json:"expiring_soon"`
	} `json:"sessions"`
	Themes struct {
		Total   int64 `json:"total"`
		Builtin int64 `json:"builtin"`
		Runtime int64 `json:"runtime"`
	} `json:"themes"`
	System struct {
		BinaryVersion     string `json:"binary_version"`
		ThemesStorageBytes int64 `json:"themes_storage_bytes"`
	} `json:"system"`
}

// GET /api/admin/dashboard
func (h *Handler) Dashboard(c *gin.Context) {
	ctx := c.Request.Context()
	var resp dashboardResponse

	// Session counts.
	activeSessions, err := h.Queries.CountActiveSessions(ctx)
	if err == nil {
		resp.Sessions.Active = activeSessions
	}
	expiringSoon, err := h.Queries.CountExpiringSoonSessions(ctx)
	if err == nil {
		resp.Sessions.ExpiringSoon = expiringSoon
	}

	// Theme counts.
	themes, err := h.Queries.ListThemesAdmin(ctx)
	if err == nil {
		resp.Themes.Total = int64(len(themes))
		for _, t := range themes {
			if t.IsBuiltin {
				resp.Themes.Builtin++
			} else {
				resp.Themes.Runtime++
			}
		}
	}

	// Themes directory size.
	var totalSize int64
	_ = filepath.WalkDir(h.Config.ThemesRuntimeDir, func(_ string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			if info, e := d.Info(); e == nil {
				totalSize += info.Size()
			}
		}
		return nil
	})
	resp.System.ThemesStorageBytes = totalSize

	// Binary version.
	resp.System.BinaryVersion = getBinaryVersion(h.Config.CvwonderBinaryPath)

	c.JSON(http.StatusOK, resp)
}

// GET /api/admin/system/health
func (h *Handler) SystemHealth(c *gin.Context) {
	status := "ok"
	dbStatus := "ok"
	binaryStatus := "ok"

	if err := h.Pool.Ping(c.Request.Context()); err != nil {
		dbStatus = "error"
		status = "degraded"
	}

	if _, err := exec.LookPath(h.Config.CvwonderBinaryPath); err != nil {
		binaryStatus = "not_found"
		status = "degraded"
	}

	c.JSON(http.StatusOK, gin.H{
		"status": status,
		"db":     dbStatus,
		"binary": binaryStatus,
	})
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

func queryInt(c *gin.Context, key string, defaultVal int) int {
	s := c.Query(key)
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil || v < 1 {
		return defaultVal
	}
	return v
}

func getBinaryVersion(binaryPath string) string {
	out, err := exec.Command(binaryPath, "--version").Output()
	if err != nil {
		return "unknown"
	}
	return strings.TrimSpace(string(out))
}
