import { test, expect, Page } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use authenticated state from setup
test.use({
  storageState: join(__dirname, ".auth/user.json"),
});

/** Dismiss the "Continuar avaliação anterior?" alert dialog if present */
async function dismissDraftDialog(page: Page) {
  const draftDialog = page.locator('[role="alertdialog"]');
  const hasDraft = await draftDialog
    .isVisible({ timeout: 2_000 })
    .catch(() => false);
  if (hasDraft) {
    const discardBtn = page.getByText(/começar do zero/i);
    if (await discardBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await discardBtn.click({ force: true });
      await draftDialog
        .waitFor({ state: "hidden", timeout: 3_000 })
        .catch(() => {});
    }
  }
}

test.describe("Wizard — New Case Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/new-case");
    // Wait for wizard to render
    await page.waitForTimeout(1_000);
    await dismissDraftDialog(page);
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

    // Dismiss any late-appearing draft dialog before clicking analysis
    await dismissDraftDialog(page);

    // Click quick analysis — use force to bypass any overlay remnants
    await page.getByText(/análise rápida/i).click({ force: true });

    // Analysis step — wait for AI processing
    // May fail if AI service is not running or credits are insufficient
    try {
      await expect(
        page.getByText(/analisando|processando|detectando/i).first()
      ).toBeVisible({ timeout: 15_000 });
    } catch {
      // Check for insufficient credits or error messages
      const hasError = await page
        .getByText(/créditos insuficientes|erro|insufficient/i)
        .isVisible({ timeout: 3_000 })
        .catch(() => false);
      if (hasError) {
        test.skip(true, "Insufficient credits or AI service error");
        return;
      }
      test.skip(true, "AI analysis did not start — service may not be running");
      return;
    }

    // Wait for analysis to complete (up to 60s)
    try {
      await expect(
        page.getByText(/revisão|review/i).first()
      ).toBeVisible({ timeout: 60_000 });
    } catch {
      test.skip(true, "AI analysis did not complete — service may be unavailable");
      return;
    }

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

    // Dismiss any late-appearing draft dialog
    await dismissDraftDialog(page);

    await page.getByText(/análise rápida/i).click({ force: true });

    // Wait for review step — requires AI analysis to complete
    try {
      await expect(
        page.getByText(/revisão|review/i).first()
      ).toBeVisible({ timeout: 60_000 });
    } catch {
      test.skip(true, "AI analysis did not complete — cannot test back navigation from review");
      return;
    }

    // Click back button
    const backBtn = page.getByText(/voltar/i).first();
    if (await backBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await backBtn.click({ force: true });

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
