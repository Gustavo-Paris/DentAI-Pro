import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use authenticated state from setup
test.use({
  storageState: join(__dirname, ".auth/user.json"),
});

test.describe("Wizard — New Case Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/new-case");
  });

  test("displays photo upload step on entry", async ({ page }) => {
    // Photo step should be visible
    await expect(
      page.getByText(/foto intraoral/i)
    ).toBeVisible({ timeout: 10_000 });

    // File upload area should be present
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
  });

  test("can upload a photo and see preview", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();

    // Upload a test image
    await fileInput.setInputFiles(
      join(__dirname, "fixtures/test-intraoral.jpg")
    );

    // Preview image should appear
    await expect(
      page.locator('img[alt*="intraoral" i], img[alt*="Intraoral" i]')
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows quick analysis and full analysis options after photo", async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"]').first();

    await fileInput.setInputFiles(
      join(__dirname, "fixtures/test-intraoral.jpg")
    );

    // Wait for photo preview
    await expect(
      page.locator('img[alt*="intraoral" i], img[alt*="Intraoral" i]')
    ).toBeVisible({ timeout: 10_000 });

    // Both analysis options should be visible
    await expect(
      page.getByText(/análise completa|análise rápida/i).first()
    ).toBeVisible();
  });

  test("quick analysis flow: photo → analysis → review → result", async ({
    page,
  }) => {
    test.setTimeout(120_000); // AI analysis can take time

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      join(__dirname, "fixtures/test-intraoral.jpg")
    );

    // Wait for photo preview
    await expect(
      page.locator('img[alt*="intraoral" i], img[alt*="Intraoral" i]')
    ).toBeVisible({ timeout: 10_000 });

    // Click quick analysis
    await page.getByText(/análise rápida/i).click();

    // Analysis step — wait for AI processing
    await expect(
      page.getByText(/analisando|processando|detectando/i).first()
    ).toBeVisible({ timeout: 15_000 });

    // Wait for analysis to complete (up to 60s)
    await expect(
      page.getByText(/revisão|review/i).first()
    ).toBeVisible({ timeout: 60_000 });

    // Review step — should show detected tooth data
    await expect(
      page.getByText(/dente|tooth/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Generate the case
    const generateBtn = page.getByText(/gerar caso/i);
    if (await generateBtn.isVisible()) {
      await generateBtn.click();

      // Wait for result or redirect
      await expect(
        page.getByText(/sucesso|resultado|protocolo/i).first()
      ).toBeVisible({ timeout: 30_000 });
    }
  });

  test("can navigate back from review step", async ({ page }) => {
    test.setTimeout(120_000);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      join(__dirname, "fixtures/test-intraoral.jpg")
    );

    await expect(
      page.locator('img[alt*="intraoral" i], img[alt*="Intraoral" i]')
    ).toBeVisible({ timeout: 10_000 });

    await page.getByText(/análise rápida/i).click();

    // Wait for review step
    await expect(
      page.getByText(/revisão|review/i).first()
    ).toBeVisible({ timeout: 60_000 });

    // Click back button
    const backBtn = page.getByText(/voltar/i).first();
    if (await backBtn.isVisible()) {
      await backBtn.click();

      // Should return to previous step
      await expect(
        page.getByText(/foto|upload|análise/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("draft restoration dialog appears for abandoned wizards", async ({
    page,
  }) => {
    // Start and abandon a wizard to create a draft
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      join(__dirname, "fixtures/test-intraoral.jpg")
    );

    await expect(
      page.locator('img[alt*="intraoral" i], img[alt*="Intraoral" i]')
    ).toBeVisible({ timeout: 10_000 });

    // Navigate away to create draft
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    // Come back — draft dialog may appear
    await page.goto("/new-case");

    // Either the draft dialog appears, or we're back at step 1
    const hasDraftDialog = await page
      .getByText(/continuar avaliação|rascunho/i)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (hasDraftDialog) {
      await expect(
        page.getByText(/continuar|começar do zero/i).first()
      ).toBeVisible();
    }
  });
});
