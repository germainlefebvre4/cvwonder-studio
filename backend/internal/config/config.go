package config

import (
	"fmt"
	"os"
	"strconv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port                string
	DatabaseURL         string
	CvwonderBinaryPath  string
	SessionsBaseDir     string
	ThemesRuntimeDir    string
	ThemesBuiltinDir    string
	SessionDurationDays int
	AdminUsername       string
	AdminPasswordHash   string
	AdminTokenSecret    string
	// Google OAuth / user auth
	GoogleClientID     string
	GoogleClientSecret string
	UserTokenSecret    string
}

// Load reads configuration from environment variables, applying defaults where
// values are absent.
func Load() (*Config, error) {
	cfg := &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		CvwonderBinaryPath:  getEnv("CVWONDER_BINARY_PATH", "/usr/local/bin/cvwonder"),
		SessionsBaseDir:     getEnv("SESSIONS_BASE_DIR", "/data/sessions"),
		ThemesRuntimeDir:    getEnv("THEMES_RUNTIME_DIR", "/data/themes"),
		ThemesBuiltinDir:    getEnv("THEMES_BUILTIN_DIR", "/app/themes"),
		SessionDurationDays: getEnvInt("SESSION_DURATION_DAYS", 30),
		AdminUsername:       getEnv("ADMIN_USERNAME", ""),
		AdminPasswordHash:   getEnv("ADMIN_PASSWORD_HASH", ""),
		AdminTokenSecret:    getEnv("ADMIN_TOKEN_SECRET", ""),
		GoogleClientID:      getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:  getEnv("GOOGLE_CLIENT_SECRET", ""),
		UserTokenSecret:     getEnv("USER_TOKEN_SECRET", ""),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	if cfg.AdminUsername == "" {
		panic("ADMIN_USERNAME environment variable is required")
	}
	if cfg.AdminPasswordHash == "" {
		panic("ADMIN_PASSWORD_HASH environment variable is required")
	}
	if cfg.AdminTokenSecret == "" {
		panic("ADMIN_TOKEN_SECRET environment variable is required")
	}

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	s := getEnv(key, "")
	if s == "" {
		return defaultVal
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return defaultVal
	}
	return v
}
