package userauth

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const contextKeyUserID = "user_id"

// UserMiddleware is a non-blocking middleware that extracts the user_id from the
// user_session cookie and sets it in the Gin context. If the cookie is missing
// or invalid, the request proceeds without a user_id.
func UserMiddleware(tokenSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie("user_session")
		if err == nil && cookie != "" {
			if id, err := VerifyUserToken(tokenSecret, cookie); err == nil {
				c.Set(contextKeyUserID, id)
			}
		}
		c.Next()
	}
}

// GetUserID retrieves the authenticated user's UUID from the context, if any.
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	v, ok := c.Get(contextKeyUserID)
	if !ok {
		return uuid.Nil, false
	}
	id, ok := v.(uuid.UUID)
	return id, ok
}

// RequireUser is a blocking middleware that returns HTTP 401 if no authenticated
// user is present in the context. Must be used after UserMiddleware.
func RequireUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, ok := GetUserID(c); !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}
