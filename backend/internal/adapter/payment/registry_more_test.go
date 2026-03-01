package payment

import (
	"context"
	"testing"

	"xiaoheiplay/internal/app/shared"
	"xiaoheiplay/internal/testutil"
)

func TestRegistry_ListAndUpdate(t *testing.T) {
	_, repo := testutil.NewTestDB(t, false)
	reg := NewRegistry(repo)
	ctx := context.Background()

	providers, err := reg.ListProviders(ctx, true)
	if err != nil {
		t.Fatalf("list providers: %v", err)
	}
	if len(providers) == 0 {
		t.Fatalf("expected providers")
	}

	cfg, enabled, err := reg.GetProviderConfig(ctx, "approval")
	if err != nil {
		t.Fatalf("get provider config: %v", err)
	}
	if cfg != "" || !enabled {
		t.Fatalf("expected approval default config empty and enabled status")
	}

	if err := reg.UpdateProviderConfig(ctx, "approval", true, ``); err != nil {
		t.Fatalf("update provider config: %v", err)
	}
	provider, err := reg.GetProvider(ctx, "approval")
	if err != nil {
		t.Fatalf("get provider: %v", err)
	}
	if provider.Key() != "approval" {
		t.Fatalf("unexpected provider key: %s", provider.Key())
	}
	if _, err := provider.CreatePayment(ctx, shared.PaymentCreateRequest{OrderID: 1, UserID: 2, Amount: 1000, Subject: "test"}); err == nil {
		t.Fatalf("expected approval provider create payment unsupported")
	}

	if err := reg.UpdateProviderConfig(ctx, "approval", false, ``); err != nil {
		t.Fatalf("disable provider: %v", err)
	}
	if _, err := reg.GetProvider(ctx, "approval"); err == nil {
		t.Fatalf("expected forbidden")
	}
}

func TestRegistry_SceneEnabledPersistence(t *testing.T) {
	_, repo := testutil.NewTestDB(t, false)
	reg := NewRegistry(repo)
	ctx := context.Background()

	enabled, err := reg.GetProviderSceneEnabled(ctx, "approval", "order")
	if err != nil {
		t.Fatalf("get default provider scene enabled: %v", err)
	}
	if !enabled {
		t.Fatalf("expected scene enabled by default")
	}

	if err := reg.UpdateProviderSceneEnabled(ctx, "approval", "order", false); err != nil {
		t.Fatalf("disable provider scene: %v", err)
	}
	enabled, err = reg.GetProviderSceneEnabled(ctx, "approval", "order")
	if err != nil {
		t.Fatalf("get updated provider scene enabled: %v", err)
	}
	if enabled {
		t.Fatalf("expected order scene disabled after update")
	}

	enabled, err = reg.GetProviderSceneEnabled(ctx, "approval", "wallet")
	if err != nil {
		t.Fatalf("get other scene enabled state: %v", err)
	}
	if !enabled {
		t.Fatalf("expected other scene to remain enabled")
	}
}
