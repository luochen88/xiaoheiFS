package http

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"xiaoheiplay/internal/domain"
)

type Server struct {
	Engine *gin.Engine
}

const (
	spaIndexCacheControl   = "no-store"
	spaDefaultCacheControl = "no-cache"
	spaAssetCacheControl   = "public, max-age=31536000, immutable"
)

func securityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

func NewServer(handler *Handler, middleware *Middleware) *Server {
	r := gin.Default()
	r.Use(securityHeadersMiddleware())
	r.Use(corsMiddleware())
	r.Static("/uploads", "./uploads")

	// Installer gate: before installation completes, redirect site traffic to /install and
	// block non-install API calls to avoid confusing errors.
	r.Use(installGateMiddleware(handler))

	// Serve the built frontend from ./static.
	//
	// The web tier is a single history-mode SPA carrying the public site, the auth
	// pages, the user console at /console, the installer at /install and the admin
	// console at the operator-configured admin_path. Requests that resolve to a file
	// are served as-is; every other non-API GET falls back to index.html and the
	// client router decides what to render, including which admin path is valid.
	spaExcludedPrefixes := []string{"/api/", "/admin/api/", "/uploads/"}
	r.Use(spaStaticFileMiddleware("./static", spaExcludedPrefixes))
	r.NoRoute(spaIndexFallbackHandler("./static", spaExcludedPrefixes))
	for _, registrar := range defaultRouteRegistrars() {
		registrar.Register(r, handler, middleware)
	}

	return &Server{Engine: r}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.GetHeader("Origin"))
		if origin == "" || !isAllowedLocalOrigin(origin) {
			c.Next()
			return
		}

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,Accept,X-API-Key,X-API-Version,X-AKID,X-Timestamp,X-Nonce,X-Signature,Idempotency-Key")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == http.MethodOptions {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}

func isAllowedLocalOrigin(origin string) bool {
	lower := strings.ToLower(origin)
	if strings.HasPrefix(lower, "http://localhost:") || strings.HasPrefix(lower, "https://localhost:") {
		return true
	}
	if strings.HasPrefix(lower, "http://127.0.0.1:") || strings.HasPrefix(lower, "https://127.0.0.1:") {
		return true
	}
	if strings.HasPrefix(lower, "http://[::1]:") || strings.HasPrefix(lower, "https://[::1]:") {
		return true
	}
	return false
}

func installGateMiddleware(handler *Handler) gin.HandlerFunc {
	return func(c *gin.Context) {
		if handler == nil || handler.IsInstalled() {
			c.Next()
			return
		}

		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/v1/install") {
			c.Next()
			return
		}
		if strings.HasPrefix(path, "/api/") || strings.HasPrefix(path, "/admin/api/") {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": domain.ErrNotInstalled.Error()})
			return
		}

		// Allow uploads and static assets so the installer page can load.
		if strings.HasPrefix(path, "/uploads/") || strings.HasPrefix(path, "/assets/") || path == "/favicon.ico" {
			c.Next()
			return
		}

		// Allow direct access to installer page itself.
		if path == "/install" {
			c.Redirect(http.StatusTemporaryRedirect, "/install/")
			c.Abort()
			return
		}
		if strings.HasPrefix(path, "/install/") {
			c.Next()
			return
		}

		// Browser navigation: redirect to /install/.
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead {
			c.Redirect(http.StatusFound, "/install/")
			c.Abort()
			return
		}

		c.AbortWithStatus(http.StatusNotFound)
	}
}

func spaStaticFileMiddleware(staticDir string, excludedPrefixes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Next()
			return
		}

		reqPath := c.Request.URL.Path
		for _, p := range excludedPrefixes {
			if strings.HasPrefix(reqPath, p) {
				c.Next()
				return
			}
		}

		selectedDir := staticDir
		rel := strings.TrimPrefix(reqPath, "/")

		target := filepath.Join(selectedDir, filepath.FromSlash(rel))
		targetAbs, err := filepath.Abs(target)
		if err != nil {
			c.Next()
			return
		}
		targetAbs = filepath.Clean(targetAbs)

		staticAbs, staticAbsErr := filepath.Abs(selectedDir)
		staticAbs = filepath.Clean(staticAbs)

		// Basic path traversal guard: only serve files within the selected SPA dir.
		if staticAbsErr == nil {
			if targetAbs != staticAbs && !strings.HasPrefix(targetAbs, staticAbs+string(os.PathSeparator)) {
				c.Next()
				return
			}
		}

		st, err := os.Stat(targetAbs)
		if err != nil || st.IsDir() {
			c.Next()
			return
		}

		applySPACacheHeaders(c, rel, false)
		c.File(targetAbs)
		c.Abort()
	}
}

func spaIndexFallbackHandler(staticDir string, excludedPrefixes []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		reqPath := c.Request.URL.Path
		for _, p := range excludedPrefixes {
			if strings.HasPrefix(reqPath, p) {
				c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": domain.ErrNotFound.Error()})
				return
			}
		}

		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}

		indexPath := filepath.Join(staticDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			applySPACacheHeaders(c, "index.html", true)
			c.File(indexPath)
			return
		}
		c.AbortWithStatus(http.StatusNotFound)
	}
}

func applySPACacheHeaders(c *gin.Context, rel string, isIndex bool) {
	if isIndex {
		c.Header("Cache-Control", spaIndexCacheControl)
		return
	}

	if isImmutableAssetPath(rel) {
		c.Header("Cache-Control", spaAssetCacheControl)
		return
	}

	c.Header("Cache-Control", spaDefaultCacheControl)
}

func isImmutableAssetPath(rel string) bool {
	trimmed := strings.TrimPrefix(rel, "/")
	if !strings.HasPrefix(trimmed, "assets/") {
		return false
	}

	base := filepath.Base(trimmed)
	if base == "" {
		return false
	}

	ext := filepath.Ext(base)
	name := strings.TrimSuffix(base, ext)
	if ext == ".gz" {
		innerExt := filepath.Ext(name)
		name = strings.TrimSuffix(name, innerExt)
		ext = innerExt
	}

	if ext == "" {
		return false
	}

	dash := strings.LastIndex(name, "-")
	return dash > 0 && dash < len(name)-1
}
