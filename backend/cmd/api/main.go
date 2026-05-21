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

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/cvwonder"
	ginhttp "github.com/germainlefebvre4/cvwonder-studio/internal/adapters/http"
	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
	"github.com/germainlefebvre4/cvwonder-studio/internal/config"
	previewUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/preview"
	sessionUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/session"
	themeUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/theme"
	validationUC "github.com/germainlefebvre4/cvwonder-studio/internal/usecases/validation"
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
	_ = configRepo

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

	// ── HTTP Handlers ─────────────────────────────────────────────────────────
	sessionHandler := ginhttp.NewSessionHandler(createSessionUC, getSessionUC, updateSessionUC)
	generationHandler := ginhttp.NewGenerationHandler(getSessionUC, generatePreviewUC, validateUC)
	themeHandler := ginhttp.NewThemeHandler(listThemesUC)
	previewHandler := ginhttp.NewPreviewHandler(cfg.SessionsBaseDir)
	healthHandler := ginhttp.NewHealthHandler(pool)

	// ── Gin Router ────────────────────────────────────────────────────────────
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ginhttp.RequestIDMiddleware())
	r.Use(ginhttp.SlogLogger())
	r.Use(ginhttp.RateLimiterMiddleware(100))

	// Health
	r.GET("/health/live", healthHandler.Live)
	r.GET("/health/ready", healthHandler.Ready)

	// Preview static file serving
	r.GET("/preview/:token/*filepath", previewHandler.ServeFile)

	// API v1
	v1 := r.Group("/api/v1")
	{
		v1.POST("/sessions", sessionHandler.Create)
		v1.GET("/sessions/:token", sessionHandler.Get)
		v1.PATCH("/sessions/:token", sessionHandler.Update)
		v1.POST("/sessions/:token/preview", generationHandler.GeneratePreview)
		v1.POST("/sessions/:token/validate", generationHandler.ValidateYaml)
		v1.GET("/themes", themeHandler.List)
	}

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
