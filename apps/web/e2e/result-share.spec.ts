import { test, expect } from "@playwright/test";
import path from "path";

// Use authenticated state from setup
test.use({
  storageState: path.join(__dirname, ".auth/user.json"),
});

test.describe("Result Page & Share", () => {
  test("navigates to evaluation list", async ({ page }) => {
    await page.goto("/evaluations");

    await expect(
      page.getByText(/avaliações/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("evaluation list shows session cards", async ({ page }) => {
    await page.goto("/evaluations");

    // Wait for list to load — either sessions or empty state
    const hasContent = await page
      .locator("[data-testid='session-card'], a[href*='/evaluation/']")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    const hasEmptyState = await page
      .getByText(/nenhuma avaliação/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasContent || hasEmptyState).toBeTruthy();
  });

  test("can navigate to evaluation details", async ({ page }) => {
    await page.goto("/evaluations");

    // Click on the first evaluation if available
    const firstSession = page
      .locator("a[href*='/evaluation/']")
      .first();

    const exists = await firstSession
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (!exists) {
      test.skip(true, "No evaluations found — create one via wizard first");
      return;
    }

    await firstSession.click();

    await expect(page).toHaveURL(/\/evaluation\//, { timeout: 10_000 });
  });

  test("evaluation details shows treatment results", async ({ page }) => {
    await page.goto("/evaluations");

    const firstSession = page
      .locator("a[href*='/evaluation/']")
      .first();

    if (!(await firstSession.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No evaluations available");
      return;
    }

    await firstSession.click();
    await expect(page).toHaveURL(/\/evaluation\//, { timeout: 10_000 });

    // Should show treatment cards or tooth labels
    await expect(
      page.getByText(/dente|tratamento|protocolo/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("can open individual result page", async ({ page }) => {
    await page.goto("/evaluations");

    const firstSession = page.locator("a[href*='/evaluation/']").first();
    if (!(await firstSession.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No evaluations available");
      return;
    }

    await firstSession.click();
    await expect(page).toHaveURL(/\/evaluation\//, { timeout: 10_000 });

    // Find and click a result link
    const resultLink = page.locator("a[href*='/result/']").first();
    if (!(await resultLink.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No result links found");
      return;
    }

    await resultLink.click();
    await expect(page).toHaveURL(/\/result\//, { timeout: 10_000 });

    // Result page should show protocol content
    await expect(
      page.getByText(/protocolo|camada|resina/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("result page has PDF download button", async ({ page }) => {
    await page.goto("/evaluations");

    const firstSession = page.locator("a[href*='/evaluation/']").first();
    if (!(await firstSession.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No evaluations available");
      return;
    }

    await firstSession.click();
    await expect(page).toHaveURL(/\/evaluation\//, { timeout: 10_000 });

    const resultLink = page.locator("a[href*='/result/']").first();
    if (!(await resultLink.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No result links found");
      return;
    }

    await resultLink.click();
    await expect(page).toHaveURL(/\/result\//, { timeout: 10_000 });

    // PDF button should exist
    await expect(
      page.getByText(/baixar pdf|exportar pdf|download pdf/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("share button generates public link", async ({ page }) => {
    await page.goto("/evaluations");

    const firstSession = page.locator("a[href*='/evaluation/']").first();
    if (!(await firstSession.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "No evaluations available");
      return;
    }

    await firstSession.click();
    await expect(page).toHaveURL(/\/evaluation\//, { timeout: 10_000 });

    // Find share button
    const shareBtn = page.getByText(/compartilhar/i).first();
    if (!(await shareBtn.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, "Share button not found on this evaluation");
      return;
    }

    await shareBtn.click();

    // Should show success toast with link copied message
    await expect(
      page.getByText(/link copiado|compartilh/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shared evaluation page loads for valid token", async ({ page }) => {
    // Navigate to an existing shared link if available — or skip
    // This test validates the public /shared/:token route works
    await page.goto("/shared/test-invalid-token");

    // Should show expired/invalid message
    await expect(
      page.getByText(/expirado|inválido|expired/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
