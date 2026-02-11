import { test, expect } from "@playwright/test";

test.describe("Login → Dashboard", () => {
  test("shows login form with email and password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.goto("/login");

    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission — email field required
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("aria-required", "true");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("invalid@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    // Wait for error toast/message
    await expect(
      page.getByText(/incorretos|erro/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E credentials not configured");
      return;
    }

    await page.goto("/login");

    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Dashboard greeting should be visible
    await expect(
      page.getByText(/bom dia|boa tarde|boa noite/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/login");

    await page.getByText(/esqueci|esqueceu/i).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("sign up link navigates to register", async ({ page }) => {
    await page.goto("/login");

    await page.getByText(/criar conta/i).click();

    await expect(page).toHaveURL(/\/register/);
  });

  test("redirects authenticated user away from login", async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL;
    const password = process.env.E2E_USER_PASSWORD;
    if (!email || !password) {
      test.skip(true, "E2E credentials not configured");
      return;
    }

    // Login first
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Try to go back to login — should redirect
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
  });
});
