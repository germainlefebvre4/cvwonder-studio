package http

import (
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

// RequestIDMiddleware injects a unique request ID into every request context.
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := uuid.New().String()
		c.Set("request_id", id)
		c.Header("X-Request-ID", id)
		c.Next()
	}
}

// SlogLogger logs each request with structured slog output.
func SlogLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		slog.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration_ms", time.Since(start).Milliseconds(),
			"request_id", c.GetString("request_id"),
			"client_ip", c.ClientIP(),
		)
	}
}

// ipLimiter holds a per-IP token bucket limiter.
type ipLimiter struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimiterMiddleware limits requests to maxReqPerMin per IP.
// Old entries are cleaned up every cleanupInterval.
func RateLimiterMiddleware(maxReqPerMin int) gin.HandlerFunc {
	mu := &sync.Mutex{}
	limiters := make(map[string]*ipLimiter)

	// Background cleanup of stale entries.
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			for ip, l := range limiters {
				if time.Since(l.lastSeen) > 10*time.Minute {
					delete(limiters, ip)
				}
			}
			mu.Unlock()
		}
	}()

	r := rate.Limit(float64(maxReqPerMin) / 60.0) // tokens per second
	b := maxReqPerMin                               // burst = 1 minute worth

	getLimiter := func(ip string) *rate.Limiter {
		mu.Lock()
		defer mu.Unlock()
		if l, ok := limiters[ip]; ok {
			l.lastSeen = time.Now()
			return l.limiter
		}
		l := &ipLimiter{
			limiter:  rate.NewLimiter(r, b),
			lastSeen: time.Now(),
		}
		limiters[ip] = l
		return l.limiter
	}

	return func(c *gin.Context) {
		if !getLimiter(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		c.Next()
	}
}
