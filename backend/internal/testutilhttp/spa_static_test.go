package testutilhttp

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"xiaoheiplay/internal/domain"
)

// The web tier is a single history-mode SPA served from ./static. It carries the
// public site, the auth pages, the user console at /console, the installer at
// /install and the admin console at the operator-configured admin_path.
//
// There is no second SPA directory and no hash-URL redirect: every non-API,
// non-upload GET that does not resolve to a file falls back to index.html and
// the client router takes over.

func spaTestDir(t *testing.T) {
	t.Helper()

	cwd, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	tmp := t.TempDir()
	if err := os.Chdir(tmp); err != nil {
		t.Fatalf("chdir: %v", err)
	}
	t.Cleanup(func() { _ = os.Chdir(cwd) })

	if err := os.MkdirAll(filepath.Join("static", "assets"), 0o755); err != nil {
		t.Fatalf("mkdir static: %v", err)
	}
	writes := map[string]string{
		filepath.Join("static", "index.html"):                  "INDEX_OK",
		filepath.Join("static", "assets", "hello.txt"):         "HELLO_OK",
		filepath.Join("static", "assets", "index-abc123.js"):   "HASHED_OK",
		filepath.Join("static", "assets", "app-def456.js.gz"):  "GZIPPED_OK",
		filepath.Join("static", "favicon.ico"):                 "FAVICON_OK",
	}
	for path, body := range writes {
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatalf("write %s: %v", path, err)
		}
	}
}

func getSPA(t *testing.T, env *Env, target string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	env.Router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, target, nil))
	return rec
}

func TestSPAServesIndexForHistoryRoutes(t *testing.T) {
	spaTestDir(t)
	env := NewTestEnv(t, false)

	// Every client-side route falls back to index.html, whatever realm it belongs to.
	for _, target := range []string{
		"/",
		"/products",
		"/docs/getting-started",
		"/login",
		"/cart",
		"/console",
		"/console/orders/123",
		"/install",
	} {
		rec := getSPA(t, env, target)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: expected 200, got %d", target, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "INDEX_OK") {
			t.Fatalf("%s: expected index.html body, got: %q", target, rec.Body.String())
		}
		if cacheControl := rec.Header().Get("Cache-Control"); cacheControl != "no-store" {
			t.Fatalf("%s: expected index cache header no-store, got %q", target, cacheControl)
		}
	}
}

func TestSPAServesAssetsWithCacheHeaders(t *testing.T) {
	spaTestDir(t)
	env := NewTestEnv(t, false)

	cases := []struct {
		target string
		body   string
		cache  string
	}{
		// Unhashed assets may be replaced in place, so they must be revalidated.
		{"/assets/hello.txt", "HELLO_OK", "no-cache"},
		// Content-hashed assets are immutable and can be cached for a year.
		{"/assets/index-abc123.js", "HASHED_OK", "public, max-age=31536000, immutable"},
		// The build also emits .gz siblings; the hash sits before the double extension.
		{"/assets/app-def456.js.gz", "GZIPPED_OK", "public, max-age=31536000, immutable"},
		// Files outside assets/ are served but not long-cached.
		{"/favicon.ico", "FAVICON_OK", "no-cache"},
	}

	for _, tc := range cases {
		rec := getSPA(t, env, tc.target)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: expected 200, got %d", tc.target, rec.Code)
		}
		if strings.TrimSpace(rec.Body.String()) != tc.body {
			t.Fatalf("%s: unexpected body %q", tc.target, rec.Body.String())
		}
		if cacheControl := rec.Header().Get("Cache-Control"); cacheControl != tc.cache {
			t.Fatalf("%s: expected cache header %q, got %q", tc.target, tc.cache, cacheControl)
		}
	}
}

func TestSPADoesNotSwallowAPIRoutes(t *testing.T) {
	spaTestDir(t)
	env := NewTestEnv(t, false)

	for _, target := range []string{
		"/api/v1/does-not-exist",
		"/admin/api/v1/does-not-exist",
	} {
		rec := getSPA(t, env, target)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("%s: expected 404, got %d", target, rec.Code)
		}
		if strings.Contains(rec.Body.String(), "INDEX_OK") {
			t.Fatalf("%s: API 404 must not return index.html", target)
		}
	}
}

// A configured admin_path is purely a client-side route: the server keeps
// serving the same index.html and must not special-case or redirect it.
func TestSPAServesIndexForConfiguredAdminPath(t *testing.T) {
	spaTestDir(t)
	env := NewTestEnv(t, false)

	if err := env.Repo.UpsertSetting(context.Background(), domain.Setting{
		Key:       "admin_path",
		ValueJSON: "Secret123",
	}); err != nil {
		t.Fatalf("seed admin_path: %v", err)
	}

	for _, target := range []string{
		"/Secret123",
		"/Secret123/",
		"/Secret123/login",
		"/Secret123/dashboard/console?id=7",
	} {
		rec := getSPA(t, env, target)
		if rec.Code != http.StatusOK {
			t.Fatalf("%s: expected 200, got %d (no redirect should happen)", target, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "INDEX_OK") {
			t.Fatalf("%s: expected index.html body, got: %q", target, rec.Body.String())
		}
	}

	// Assets resolve from the one static dir regardless of the admin path.
	rec := getSPA(t, env, "/assets/index-abc123.js")
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "HASHED_OK" {
		t.Fatalf("asset under configured admin path: got %d %q", rec.Code, rec.Body.String())
	}
}

func TestSPARejectsPathTraversal(t *testing.T) {
	spaTestDir(t)

	// A file the SPA must never be able to reach by escaping its directory.
	if err := os.WriteFile("secret.txt", []byte("SECRET_LEAK"), 0o644); err != nil {
		t.Fatalf("write secret: %v", err)
	}

	env := NewTestEnv(t, false)

	for _, target := range []string{
		"/../secret.txt",
		"/assets/../../secret.txt",
	} {
		rec := getSPA(t, env, target)
		if strings.Contains(rec.Body.String(), "SECRET_LEAK") {
			t.Fatalf("%s: path traversal leaked a file outside the SPA dir", target)
		}
	}
}
