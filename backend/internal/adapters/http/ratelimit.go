package http

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"

	"github.com/germainlefebvre4/cvwonder-studio/internal/adapters/repository"
)

// ── Session creation rate limit (task 12.1) ──────────────────────────────────

type sessionCreationLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rateLimitEntry
}

type rateLimitEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var sessionRateLimiter = &sessionCreationLimiter{
	limiters: make(map[string]*rateLimitEntry),
}

func init() {
	// Background cleanup every 10 minutes.
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			sessionRateLimiter.mu.Lock()
			for ip, entry := range sessionRateLimiter.limiters {
				if time.Since(entry.lastSeen) > 30*time.Minute {
					delete(sessionRateLimiter.limiters, ip)
				}
			}
			sessionRateLimiter.mu.Unlock()
		}
	}()
}

// SessionCreationRateLimitMiddleware limits session creation by IP.
// The limit is read from system_config key `session_creation_rate_limit_per_hour`.
func SessionCreationRateLimitMiddleware(cfg *repository.ConfigRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitPerHour := 3 // default
		if cfg != nil {
			if v, err := cfg.Get(c.Request.Context(), "session_creation_rate_limit_per_hour"); err == nil && v != "" {
				if n, err := strconv.Atoi(v); err == nil && n > 0 {
					limitPerHour = n
				}
			}
		}

		ip := c.ClientIP()
		sessionRateLimiter.mu.Lock()
		entry, ok := sessionRateLimiter.limiters[ip]
		if !ok {
			// limitPerHour tokens per hour = limitPerHour/3600 per second
			r := rate.Every(time.Hour / time.Duration(limitPerHour))
			entry = &rateLimitEntry{limiter: rate.NewLimiter(r, limitPerHour)}
			sessionRateLimiter.limiters[ip] = entry
		}
		entry.lastSeen = time.Now()
		limiter := entry.limiter
		sessionRateLimiter.mu.Unlock()

		if !limiter.Allow() {
			retryAfter := int(time.Hour.Seconds()) / limitPerHour
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "too many session creation requests",
				"retry_after": retryAfter,
			})
			return
		}
		c.Next()
	}
}

// ── YAML size limit middleware (task 12.2) ────────────────────────────────────

// YamlSizeLimitMiddleware rejects requests where yaml_content exceeds max_yaml_size_kb.
func YamlSizeLimitMiddleware(cfg *repository.ConfigRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		maxKB := 100 // default
		if cfg != nil {
			if v, err := cfg.Get(c.Request.Context(), "max_yaml_size_kb"); err == nil && v != "" {
				if n, err := strconv.Atoi(v); err == nil && n > 0 {
					maxKB = n
				}
			}
		}
		maxBytes := int64(maxKB) * 1024
		if c.Request.ContentLength > maxBytes {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": fmt.Sprintf("YAML content exceeds maximum size of %dKB", maxKB),
			})
			return
		}
		c.Next()
	}
}
