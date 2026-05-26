package userauth_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/germainlefebvre4/cvwonder-studio/internal/userauth"
)

func init() {
	gin.SetMode(gin.TestMode)
}

const middlewareTestSecret = "test-middleware-secret-32-chars!!"

// makeRouter builds a gin engine with the given middlewares and a simple handler
// that records the user ID (or "none") in the response body.
func makeRouter(middlewares ...gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	r.Use(middlewares...)
	r.GET("/", func(c *gin.Context) {
		if id, ok := userauth.GetUserID(c); ok {
			c.String(http.StatusOK, id.String())
		} else {
			c.String(http.StatusOK, "none")
		}
	})
	return r
}

func signedCookie(t *testing.T, userID uuid.UUID) string {
	t.Helper()
	tok, err := userauth.SignUserToken(middlewareTestSecret, userID, time.Hour)
	if err != nil {
		t.Fatalf("SignUserToken: %v", err)
	}
	return tok
}

func TestUserMiddleware_ValidCookieSetsUserID(t *testing.T) {
	userID := uuid.New()
	r := makeRouter(userauth.UserMiddleware(middlewareTestSecret))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: "user_session", Value: signedCookie(t, userID)})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if w.Body.String() != userID.String() {
		t.Errorf("body = %q, want %q", w.Body.String(), userID.String())
	}
}

func TestUserMiddleware_InvalidCookieIgnored(t *testing.T) {
	r := makeRouter(userauth.UserMiddleware(middlewareTestSecret))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: "user_session", Value: "tampered.invalid.token"})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if w.Body.String() != "none" {
		t.Errorf("body = %q, want 'none'", w.Body.String())
	}
}

func TestUserMiddleware_MissingCookiePassesThrough(t *testing.T) {
	r := makeRouter(userauth.UserMiddleware(middlewareTestSecret))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if w.Body.String() != "none" {
		t.Errorf("body = %q, want 'none'", w.Body.String())
	}
}

func TestRequireUser_BlocksUnauthenticated(t *testing.T) {
	r := gin.New()
	r.Use(userauth.UserMiddleware(middlewareTestSecret))
	r.Use(userauth.RequireUser())
	r.GET("/", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", w.Code)
	}
}

func TestRequireUser_AllowsAuthenticated(t *testing.T) {
	userID := uuid.New()
	r := gin.New()
	r.Use(userauth.UserMiddleware(middlewareTestSecret))
	r.Use(userauth.RequireUser())
	r.GET("/", func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: "user_session", Value: signedCookie(t, userID)})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}
