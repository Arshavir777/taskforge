package middleware

import (
	"net/http"
	"strings"
	"taskforge/internal/auth"
	"taskforge/internal/response"

	"github.com/gin-gonic/gin"
)

const userIDKey = "userID"

// RequireAuth rejects requests without a valid "Authorization: Bearer <jwt>" header
// and stores the authenticated user ID in the Gin context.
func RequireAuth(tm *auth.TokenManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		scheme, token, found := strings.Cut(header, " ")
		if !found || !strings.EqualFold(scheme, "Bearer") || strings.TrimSpace(token) == "" {
			response.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Missing or malformed Authorization header")
			c.Abort()
			return
		}

		claims, err := tm.Parse(strings.TrimSpace(token))
		if err != nil {
			response.Fail(c, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set(userIDKey, claims.UserID)
		c.Next()
	}
}

// UserIDFrom returns the authenticated user ID set by RequireAuth.
func UserIDFrom(c *gin.Context) (uint, bool) {
	v, ok := c.Get(userIDKey)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}
