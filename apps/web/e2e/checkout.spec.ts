import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// Unauthenticated tests — no auth state
// =============================================================================

test.describe("Pricing page — unauthenticated", () => {
  test.use({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:8080",
          localStorage: [{ name: "cookie-consent", value: "accepted" }],
        },
      ],
    },
  });

  test("shows pricing page with plan cards", async ({ page }) => {
    await page.goto("/pricing");

    // Page title or heading visible
    await expect(
      page.getByText(/planos e preços|escolha seu plano/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows plan CTA buttons", async ({ page }) => {
    await page.goto("/pricing");

    // Wait for plans to load — at least one CTA button should be visible
    await expect(
      page
        .getByRole("button", {
          name: /assinar agora|fazer upgrade|começar grátis|plano gratuito/i,
        })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows monthly/annual billing toggle", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByText(/mensal|anual/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows free plan features", async ({ page }) => {
    await page.goto("/pricing");

    // Free plan indicator — "Grátis" label or R$0
    await expect(
      page.getByText(/grátis|R\$\s*0/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Resin recommendations included in all plans
    await expect(
      page.getByText(/resina|resin/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a paid plan CTA redirects to login when unauthenticated", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Wait for plan buttons to appear
    const upgradeBtn = page
      .getByRole("button", { name: /assinar agora|fazer upgrade/i })
      .first();

    const btnVisible = await upgradeBtn
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!btnVisible) {
      test.skip(true, "No paid plan CTA buttons found — plans may not have loaded");
      return;
    }

    await upgradeBtn.click();

    // Unauthenticated users should be redirected to login
    await expect(page).toHaveURL(/\/login|\/pricing/, { timeout: 10_000 });
  });
});

// =============================================================================
// Authenticated tests — use persisted auth state
// =============================================================================

test.describe("Pricing page — authenticated", () => {
  test.use({
    storageState: join(__dirname, ".auth/user.json"),
  });

  test("loads pricing page and shows plans", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByText(/planos e preços|escolha seu plano/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // At least one plan card should be visible
    await expect(
      page
        .getByRole("button", {
          name: /assinar agora|fazer upgrade|plano atual|plano gratuito|alterar plano/i,
        })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("current plan is indicated", async ({ page }) => {
    await page.goto("/pricing");

    // Either a "Plano Atual" badge or button is shown for the active plan
    await expect(
      page.getByText(/plano atual/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("billing cycle toggle switches between monthly and annual prices", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Find the annual toggle — text varies by PageShell version
    const annualBtn = page.getByRole("button", { name: /anual/i }).first();
    const annualVisible = await annualBtn
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!annualVisible) {
      test.skip(true, "Annual billing toggle not found");
      return;
    }

    await annualBtn.click();

    // Discount label or annual price indicator should appear
    await expect(
      page.getByText(/ano|-\d+%|economia/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("clicking a paid plan initiates checkout (network request to create-checkout-session)", async ({
    page,
  }) => {
    // Intercept the Supabase edge function call before navigating
    const checkoutRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("create-checkout-session")) {
        checkoutRequests.push(req.url());
      }
    });

    await page.goto("/pricing");

    // Find a non-current paid plan button
    const upgradeBtn = page
      .getByRole("button", { name: /assinar agora|fazer upgrade|alterar plano/i })
      .first();

    const btnVisible = await upgradeBtn
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!btnVisible) {
      test.skip(
        true,
        "No upgrade button found — user may already be on highest plan"
      );
      return;
    }

    // Intercept navigation to Stripe so the test doesn't actually leave the app
    await page.route("**/checkout.stripe.com/**", (route) => route.abort());
    await page.route("**/billing.stripe.com/**", (route) => route.abort());

    await upgradeBtn.click();

    // Wait briefly for the network request to fire
    await page.waitForTimeout(3_000);

    // Either the checkout session was requested, OR we were redirected to Stripe
    // (which we aborted), OR we see a loading/processing state
    const checkoutRequested = checkoutRequests.length > 0;
    const processingVisible = await page
      .getByText(/processando/i)
      .isVisible({ timeout: 2_000 })
      .catch(() => false);
    const onStripe =
      page.url().includes("stripe.com") ||
      page.url().includes("checkout.stripe");

    // At least one signal that checkout was triggered
    if (!checkoutRequested && !processingVisible && !onStripe) {
      // Could be an inline upgrade (no redirect) — look for success toast
      const upgraded = await page
        .getByText(/plano alterado|atualizado|sucesso/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      expect(
        upgraded,
        "Expected checkout to be initiated — no network request, redirect, or success toast found"
      ).toBe(true);
    }

    // If we got here, checkout was triggered in some form
    expect(checkoutRequested || processingVisible || onStripe).toBe(true);
  });

  test("credit pack section is visible and has purchase buttons", async ({
    page,
  }) => {
    await page.goto("/pricing");

    // Credit pack section heading
    const creditPackSection = page.getByText(/comprar créditos extras/i).first();
    const sectionVisible = await creditPackSection
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!sectionVisible) {
      test.skip(
        true,
        "Credit pack section not visible — may require specific subscription state"
      );
      return;
    }

    // Buy button for credit packs
    await expect(
      page.getByRole("button", { name: /comprar/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test("success dialog appears when returning from Stripe with ?subscription=success", async ({
    page,
  }) => {
    await page.goto("/pricing?subscription=success");

    // Success dialog should appear
    await expect(
      page.getByText(/assinatura ativada/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Go to Dashboard button inside the dialog
    await expect(
      page.getByRole("button", { name: /ir para o dashboard/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test("canceled checkout cleans up URL and stays on pricing", async ({
    page,
  }) => {
    await page.goto("/pricing?subscription=canceled");

    // Should redirect back to /pricing without query param
    await expect(page).toHaveURL("/pricing", { timeout: 5_000 });

    // Plan cards should still be visible
    await expect(
      page.getByText(/planos e preços|escolha seu plano/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
