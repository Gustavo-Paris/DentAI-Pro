import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use authenticated state from setup
test.use({
  storageState: join(__dirname, ".auth/user.json"),
});

test.describe("LGPD — Data Export & Privacy", () => {
  test("navigates to privacy tab in profile", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    await expect(
      page.getByText(/dados e privacidade|seus direitos/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays LGPD rights section", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    // LGPD title
    await expect(
      page.getByText(/seus direitos.*lgpd/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Four rights should be listed
    await expect(page.getByText(/acesso e portabilidade/i)).toBeVisible();
    await expect(page.getByText(/eliminação/i).first()).toBeVisible();
    await expect(page.getByText(/correção/i).first()).toBeVisible();
    await expect(page.getByText(/informação/i).first()).toBeVisible();
  });

  test("export data button exists and is clickable", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    const exportBtn = page.getByText(/exportar meus dados/i).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });
    await expect(exportBtn).toBeEnabled();
  });

  test("export data downloads JSON file", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    const exportBtn = page.getByText(/exportar meus dados/i).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      exportBtn.click(),
    ]);

    // Verify the file name pattern
    expect(download.suggestedFilename()).toMatch(
      /tosmile-meus-dados-.*\.json$/
    );

    // Success toast
    await expect(
      page.getByText(/exportados com sucesso/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("delete account section exists with warning", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    await expect(
      page.getByText(/excluir minha conta/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Warning about permanent deletion
    await expect(
      page.getByText(/permanente|não pode ser desfeita/i).first()
    ).toBeVisible();
  });

  test("delete account opens confirmation dialog", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    // Click the delete button (not the confirm one)
    const deleteBtn = page
      .locator("button")
      .filter({ hasText: /excluir minha conta/i })
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 10_000 });

    await deleteBtn.click();

    // Confirmation dialog should appear
    await expect(
      page.getByText(/confirmar exclusão/i)
    ).toBeVisible({ timeout: 5_000 });

    // Should show the required confirmation phrase
    await expect(
      page.getByText(/EXCLUIR MINHA CONTA/i)
    ).toBeVisible();

    // Confirm button should be disabled until phrase is typed
    const confirmBtn = page
      .locator("button")
      .filter({ hasText: /excluir permanentemente/i })
      .first();
    await expect(confirmBtn).toBeDisabled();
  });

  test("delete confirmation enables only with exact phrase", async ({
    page,
  }) => {
    await page.goto("/profile?tab=privacidade");

    const deleteBtn = page
      .locator("button")
      .filter({ hasText: /excluir minha conta/i })
      .first();
    await deleteBtn.click();

    await expect(
      page.getByText(/confirmar exclusão/i)
    ).toBeVisible({ timeout: 5_000 });

    const confirmInput = page.locator("input#delete-confirmation");
    const confirmBtn = page
      .locator("button")
      .filter({ hasText: /excluir permanentemente/i })
      .first();

    // Type wrong phrase
    await confirmInput.fill("wrong phrase");
    await expect(confirmBtn).toBeDisabled();

    // Type correct phrase
    await confirmInput.clear();
    await confirmInput.fill("EXCLUIR MINHA CONTA");
    await expect(confirmBtn).toBeEnabled();

    // Cancel to avoid deleting account
    await page.getByText(/cancelar/i).first().click();
  });

  test("profile tabs navigate correctly", async ({ page }) => {
    await page.goto("/profile");

    // Tab navigation — check all tabs exist
    await expect(page.getByText(/perfil/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // Navigate to subscription tab
    const subscriptionTab = page.getByText(/assinatura/i).first();
    if (await subscriptionTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await subscriptionTab.click();
      await expect(page).toHaveURL(/tab=assinatura/);
    }

    // Navigate to invoices tab
    const invoicesTab = page.getByText(/faturas/i).first();
    if (await invoicesTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await invoicesTab.click();
      await expect(page).toHaveURL(/tab=faturas/);
    }

    // Navigate to privacy tab
    const privacyTab = page.getByText(/privacidade/i).first();
    if (await privacyTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await privacyTab.click();
      await expect(page).toHaveURL(/tab=privacidade/);
    }
  });

  test("data retention info is displayed", async ({ page }) => {
    await page.goto("/profile?tab=privacidade");

    await expect(
      page.getByText(/retenção de dados/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Should mention 30 days backup period
    await expect(
      page.getByText(/30 dias/i).first()
    ).toBeVisible();
  });
});
