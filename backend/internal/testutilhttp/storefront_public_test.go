package testutilhttp

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// The storefront is browsable before signing in: a visitor configures a product and
// fills a cart, and only checking out requires an account. That means the catalog
// reads must answer anonymous callers, while everything that touches per-user state
// must keep rejecting them.
//
// Signed-in callers still get tier pricing on these routes because they run under
// OptionalUser rather than no middleware at all.

func TestCatalogReadsArePublic(t *testing.T) {
	env := NewTestEnv(t, false)

	for _, path := range []string{
		"/api/v1/goods-types",
		"/api/v1/catalog",
		"/api/v1/plan-groups",
		"/api/v1/packages",
		"/api/v1/system-images",
		"/api/v1/billing-cycles",
	} {
		rec := httptest.NewRecorder()
		env.Router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))

		if rec.Code == http.StatusUnauthorized {
			t.Fatalf("%s: storefront read rejected an anonymous visitor (401)", path)
		}
		if rec.Code >= 500 {
			t.Fatalf("%s: anonymous read failed with %d: %s", path, rec.Code, rec.Body.String())
		}
	}
}

func TestPerUserRoutesStillRequireAuth(t *testing.T) {
	env := NewTestEnv(t, false)

	cases := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/v1/me"},
		{http.MethodGet, "/api/v1/cart"},
		{http.MethodPost, "/api/v1/cart"},
		{http.MethodGet, "/api/v1/orders"},
		{http.MethodPost, "/api/v1/orders"},
		{http.MethodGet, "/api/v1/vps"},
		{http.MethodGet, "/api/v1/wallet"},
		{http.MethodGet, "/api/v1/dashboard"},
	}

	for _, tc := range cases {
		rec := httptest.NewRecorder()
		env.Router.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%s %s: expected 401 for an anonymous caller, got %d", tc.method, tc.path, rec.Code)
		}
	}
}

// A garbage or expired token must not turn into an error on a public route —
// OptionalUser is supposed to fall through to the anonymous path.
func TestCatalogIgnoresInvalidToken(t *testing.T) {
	env := NewTestEnv(t, false)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/catalog", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-token")

	rec := httptest.NewRecorder()
	env.Router.ServeHTTP(rec, req)

	if rec.Code == http.StatusUnauthorized {
		t.Fatalf("an invalid token should be ignored on a public route, got 401")
	}
}
