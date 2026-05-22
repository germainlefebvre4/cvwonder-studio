package main

import (
	"context"
	"embed"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"

	db "github.com/germainlefebvre4/cvwonder-studio/db/generated"
	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/cvwonder"
	ginhttp "github.com/germainlefebvre4/cvwonder-studio/internal/adapters/http"
	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/admin"
	"github.com/germainlefebvre4/cvwonder-studio/internal/config"
	previewUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/preview"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
	themeUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/theme"
	validationUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/validation"
	"github.com/germainlefebvre4/cvwonder-studio/internal/userauth"
)

//go:embed dist
var staticFiles embed.FS

func main() {
	// ── Config ────────────────────────────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "error", err)
		os.Exit(1)
	}

	// ── Database ──────────────────────────────────────────────────────────────
	ctx := context.Background()
	pool, err := repository.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// ── Migrations ────────────────────────────────────────────────────────────
	if err := repository.RunMigrations(ctx, cfg.DatabaseURL, "file://db/migrations"); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}

	// ── Repositories ──────────────────────────────────────────────────────────
	sessionRepo := repository.NewSessionRepository(pool)
	themeRepo := repository.NewThemeRepository(pool)
	configRepo := repository.NewConfigRepository(pool)
	userRepo := repository.NewUserRepository(pool)

	// ── Seed system_config defaults ───────────────────────────────────────────
	if err := configRepo.SeedDefaults(ctx); err != nil {
		slog.Warn("failed to seed system_config defaults", "error", err)
	}

	// ── Adapters ──────────────────────────────────────────────────────────────
	cvwonderAdapter := cvwonder.NewBinaryAdapter(cfg.CvwonderBinaryPath)

	// ── Usecases ──────────────────────────────────────────────────────────────
	createSessionUC := sessionUC.NewCreateUsecase(sessionRepo, cfg.SessionDurationDays)
	getSessionUC := sessionUC.NewGetUsecase(sessionRepo)
	updateSessionUC := sessionUC.NewUpdateUsecase(sessionRepo, themeRepo)
	generatePreviewUC := previewUC.NewGenerateUsecase(sessionRepo, themeRepo, cvwonderAdapter, cfg.SessionsBaseDir)
	validateUC := validationUC.NewValidateUsecase(cvwonderAdapter)
	listThemesUC := themeUC.NewListUsecase(themeRepo)
	syncBuiltinUC := themeUC.NewSyncBuiltinUsecase(themeRepo, cfg.ThemesBuiltinDir)

	// Sync builtin themes at startup.
	if err := syncBuiltinUC.Execute(ctx); err != nil {
		slog.Error("failed to sync builtin themes", "error", err)
	}

	// ── OAuth / User Auth ─────────────────────────────────────────────────────
	// Google OAuth is optional; if not configured, user auth routes return 503.
	var oauthConfig *oauth2.Config
	if cfg.GoogleClientID != "" && cfg.GoogleClientSecret != "" {
		oauthConfig = userauth.NewOAuthConfig(
			cfg.GoogleClientID,
			cfg.GoogleClientSecret,
			"/api/auth/callback",
		)
	}
	userTokenSecret := cfg.UserTokenSecret
	if userTokenSecret == "" {
		userTokenSecret = cfg.AdminTokenSecret // fallback
	}

	// ── HTTP Handlers ─────────────────────────────────────────────────────────
	sessionHandler := ginhttp.NewSessionHandler(createSessionUC, getSessionUC, updateSessionUC)
	generationHandler := ginhttp.NewGenerationHandler(getSessionUC, generatePreviewUC, validateUC, configRepo)
	themeHandler := ginhttp.NewThemeHandler(listThemesUC)
	previewHandler := ginhttp.NewPreviewHandler(cfg.SessionsBaseDir)
	healthHandler := ginhttp.NewHealthHandler(pool)
	authHandler := ginhttp.NewAuthHandler(oauthConfig, userRepo, sessionRepo, db.New(pool), userTokenSecret)
	userSessionHandler := ginhttp.NewUserSessionHandler(sessionRepo, cfg.SessionsBaseDir)

	// ── Gin Router ────────────────────────────────────────────────────────────
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ginhttp.RequestIDMiddleware())
	r.Use(ginhttp.SlogLogger())
	r.Use(ginhttp.RateLimiterMiddleware(100))
	// Non-blocking user session middleware (sets user_id in context if cookie valid).
	r.Use(userauth.UserMiddleware(userTokenSecret))

	// Health
	r.GET("/health/live", healthHandler.Live)
	r.GET("/health/ready", healthHandler.Ready)

	// Preview static file serving (legacy token-based)
	r.GET("/preview/:token/*filepath", previewHandler.ServeFile)

	// Public CV viewer (session-id-based)
	r.GET("/p/:id", userSessionHandler.ServePublic)

	// API v1 (anonymous + user-aware session endpoints)
	v1 := r.Group("/api/v1")
	{
		// Session CRUD (anonymous-compatible)
		v1.POST("/sessions", ginhttp.SessionCreationRateLimitMiddleware(configRepo), sessionHandler.Create)
		v1.GET("/sessions/:token", sessionHandler.Get)
		v1.PATCH("/sessions/:token", ginhttp.YamlSizeLimitMiddleware(configRepo), sessionHandler.Update)
		v1.POST("/sessions/:token/preview", generationHandler.GeneratePreview)
		v1.POST("/sessions/:token/validate", generationHandler.ValidateYaml)
		v1.GET("/themes", themeHandler.List)
	}

	// User auth routes
	auth := r.Group("/api/auth")
	{
		auth.GET("/login", authHandler.Login)
		auth.GET("/callback", authHandler.Callback)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/me", userauth.RequireUser(), authHandler.Me)
		auth.DELETE("/account", userauth.RequireUser(), authHandler.DeleteAccount)
		auth.GET("/account/export", userauth.RequireUser(), authHandler.ExportAccount)
	}

	// User session management (requires authentication)
	apiSessions := r.Group("/api/sessions")
	apiSessions.Use(userauth.RequireUser())
	{
		apiSessions.GET("", userSessionHandler.List)
		apiSessions.PATCH("/:id/name", userSessionHandler.RenameSSession)
		apiSessions.PATCH("/:id/ttl", userSessionHandler.UpdateTTL)
		apiSessions.PATCH("/:id/theme", userSessionHandler.UpdateTheme)
		apiSessions.POST("/:id/archive", userSessionHandler.Archive)
		apiSessions.POST("/:id/restore", userSessionHandler.Restore)
		apiSessions.POST("/:id/duplicate", userSessionHandler.Duplicate)
		apiSessions.DELETE("/:id", userSessionHandler.Delete)
		apiSessions.GET("/:id/export", userSessionHandler.Export)
		apiSessions.POST("/:id/share", userSessionHandler.CreateShare)
		apiSessions.DELETE("/:id/share", userSessionHandler.RevokeShare)
		apiSessions.PUT("/:id/share/password", userSessionHandler.SetSharePassword)
		apiSessions.PATCH("/:id/tags", userSessionHandler.UpdateTags)
	}

	// Public shared session view (no auth needed)
	r.GET("/api/sessions/shared/:id/:token", userSessionHandler.GetShared)

	// User profile routes
	users := r.Group("/api/users/me")
	users.Use(userauth.RequireUser())
	{
		users.GET("/tags", authHandler.GetMyTags)
		users.PATCH("/default-theme", authHandler.UpdateDefaultTheme)
	}

	// Public limits endpoint
	r.GET("/api/config/limits", userSessionHandler.GetLimits)

	// Admin API
	admin.RegisterRoutes(r, admin.AdminDeps{
		Queries:     db.New(pool),
		Pool:        pool,
		Config:      cfg,
		TokenSecret: cfg.AdminTokenSecret,
	})

	// ── Periodic purge job ────────────────────────────────────────────────────
	go runPurgeJob(sessionRepo)

	// SPA catch-all: serve embedded frontend/dist for all non-API GET routes.
	distFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		slog.Error("failed to sub static FS", "error", err)
		os.Exit(1)
	}
	fileServer := http.FileServer(http.FS(distFS))
	r.NoRoute(func(c *gin.Context) {
		// Serve the file if it exists, otherwise fall back to index.html.
		path := c.Request.URL.Path
		if _, err := fs.Stat(distFS, path[1:]); err == nil {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}
		c.FileFromFS("index.html", http.FS(distFS))
	})

	// ── Server with Graceful Shutdown ─────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 65 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		slog.Info("starting server", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for SIGINT or SIGTERM.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "error", err)
	}
	slog.Info("server exited")
}

// runPurgeJob runs two periodic passes:
// 1. Immediate deletion of expired anonymous sessions.
// 2. Purge content of archived connected sessions older than 30 days.
// Using a single ticker makes the job idempotent and safe for multi-replica deployments.
func runPurgeJob(sessions *repository.SessionRepository) {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		ctx := context.Background()
		if err := sessions.PurgeExpiredAnonymous(ctx); err != nil {
			slog.Warn("purge anonymous sessions failed", "error", err)
		}
		if _, err := sessions.PurgeArchivedConnectedContent(ctx); err != nil {
			slog.Warn("purge archived connected sessions failed", "error", err)
		}
	}
}
