package admin

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAdmin returns a Gin middleware that validates the admin_session cookie.
// Requests without a valid, non-expired token are rejected with HTTP 401.
func RequireAdmin(tokenSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("admin_session")
		if err != nil || cookie == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		if err := VerifyToken(tokenSecret, cookie); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}
