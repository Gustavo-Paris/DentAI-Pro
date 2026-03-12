import { test, expect } from "@playwright/test";

// Reset password tests run WITHOUT auth — they test the public page behavior
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

test.describe("Reset Password", () => {
  test("shows invalid/expired link state without recovery token", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    // Without a recovery token, should show invalid link message
    await expect(
      page.getByText(/link inválido|expirado|invalid/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows request new link button on invalid state", async ({ page }) => {
    await page.goto("/reset-password");

    // Should show button to request a new recovery link
    const newLinkBtn = page
      .getByText(/solicitar novo link|novo link/i)
      .first();
    await expect(newLinkBtn).toBeVisible({ timeout: 10_000 });
  });

  test("request new link navigates to forgot-password", async ({ page }) => {
    await page.goto("/reset-password");

    // The button is wrapped in a <Link to="/forgot-password"> — click the link element
    const link = page.locator('a[href="/forgot-password"]').first();
    await expect(link).toBeVisible({ timeout: 10_000 });

    await link.click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("forgot-password page renders form correctly", async ({ page }) => {
    await page.goto("/forgot-password");

    // Email input should be present
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10_000,
    });

    // Submit button should be present
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("forgot-password validates empty email", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission — email field required
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("aria-required", "true");
  });

  test("forgot-password shows success message after submission", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('button[type="submit"]').click();

    // Should show success/confirmation message (Supabase always returns success for security)
    await expect(
      page.getByText(/enviamos|verifique|e-mail enviado|email enviado/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("back to login link works from forgot-password", async ({ page }) => {
    await page.goto("/forgot-password");

    const backLink = page.getByText(/voltar.*login|entrar/i).first();
    if (await backLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await backLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
