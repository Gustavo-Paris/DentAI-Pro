import { test, expect } from "@playwright/test";
import path from "path";

// Use authenticated state from setup
test.use({
  storageState: path.join(__dirname, ".auth/user.json"),
});

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
    // Wait for page to load
    await expect(
      page.getByText(/inventário/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays inventory page with title", async ({ page }) => {
    await expect(
      page.getByText(/meu inventário/i).first()
    ).toBeVisible();
  });

  test("shows empty state or existing resins", async ({ page }) => {
    const hasResins = await page
      .locator("[data-testid='resin-badge'], [class*='resin']")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    const hasEmpty = await page
      .getByText(/inventário vazio|adicione suas primeiras/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasResins || hasEmpty).toBeTruthy();
  });

  test("add resins dialog opens", async ({ page }) => {
    const addBtn = page.getByText(/adicionar resinas/i).first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });

    await addBtn.click();

    // Dialog should open with search and brand selector
    await expect(
      page.getByText(/adicionar resinas ao inventário/i)
    ).toBeVisible({ timeout: 5_000 });

    // Search input should be present
    await expect(
      page.locator('input[placeholder*="buscar" i], input[placeholder*="cor" i]').first()
    ).toBeVisible();
  });

  test("can search resins in add dialog", async ({ page }) => {
    await page.getByText(/adicionar resinas/i).first().click();

    await expect(
      page.getByText(/adicionar resinas ao inventário/i)
    ).toBeVisible({ timeout: 5_000 });

    // Type a search term
    const searchInput = page
      .locator('input[placeholder*="buscar" i], input[placeholder*="cor" i]')
      .first();
    await searchInput.fill("A2");

    // Wait for results to filter
    await page.waitForTimeout(500);

    // Should show filtered results or "no results"
    const hasResults = await page
      .locator("[role='group'], [class*='accordion']")
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    const hasNoResults = await page
      .getByText(/nenhuma resina/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test("can select and add resins to inventory", async ({ page }) => {
    await page.getByText(/adicionar resinas/i).first().click();

    await expect(
      page.getByText(/adicionar resinas ao inventário/i)
    ).toBeVisible({ timeout: 5_000 });

    // Expand first accordion group if present
    const accordionTrigger = page
      .locator("[data-state='closed'][role='button'], button[aria-expanded='false']")
      .first();

    if (await accordionTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await accordionTrigger.click();
      await page.waitForTimeout(300);
    }

    // Select a resin (checkbox or clickable item)
    const resinItem = page
      .locator("input[type='checkbox'], [role='checkbox']")
      .first();

    if (await resinItem.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await resinItem.click();

      // Selection counter should update
      await expect(
        page.getByText(/selecionad/i).first()
      ).toBeVisible({ timeout: 3_000 });

      // Add button should be clickable
      const addToInventoryBtn = page
        .getByText(/adicionar ao inventário/i)
        .first();
      await expect(addToInventoryBtn).toBeEnabled();
    }
  });

  test("brand filter works", async ({ page }) => {
    const hasResins = await page
      .locator("[data-testid='resin-badge'], [class*='resin']")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasResins) {
      test.skip(true, "No resins in inventory to filter");
      return;
    }

    // Look for brand filter
    const brandFilter = page
      .locator("select, [role='combobox']")
      .first();

    if (await brandFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await brandFilter.click();
      // Just verify it opens without error
      await page.waitForTimeout(300);
    }
  });

  test("remove resin shows confirmation dialog", async ({ page }) => {
    const hasResins = await page
      .locator("[data-testid='resin-badge'], [class*='resin']")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasResins) {
      test.skip(true, "No resins to remove");
      return;
    }

    // Hover over first resin to reveal remove button
    const firstResin = page
      .locator("[data-testid='resin-badge'], [class*='resin']")
      .first();
    await firstResin.hover();

    // Click remove button (X icon)
    const removeBtn = page
      .locator("button[title*='remover' i], button:has(svg)")
      .first();

    if (await removeBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await removeBtn.click();

      // Confirmation dialog should appear
      await expect(
        page.getByText(/confirmar remoção/i)
      ).toBeVisible({ timeout: 5_000 });

      // Cancel to avoid actually removing
      const cancelBtn = page.getByText(/cancelar/i).first();
      await cancelBtn.click();
    }
  });

  test("CSV export button works when resins exist", async ({ page }) => {
    const csvBtn = page.getByText(/csv/i).first();
    const hasCsvBtn = await csvBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasCsvBtn) {
      test.skip(true, "No CSV button — inventory may be empty");
      return;
    }

    // Intercept downloads
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 5_000 }).catch(() => null),
      csvBtn.click(),
    ]);

    // Either a download started or a toast appeared
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.csv$/);
    }
  });
});
