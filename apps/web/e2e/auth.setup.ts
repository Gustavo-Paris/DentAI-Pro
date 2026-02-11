import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

/**
 * Shared authentication setup — runs once before all tests.
 * Stores authenticated state to a file so all tests start logged-in.
 *
 * Requires env vars: E2E_USER_EMAIL, E2E_USER_PASSWORD
 */
setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing E2E_USER_EMAIL or E2E_USER_PASSWORD environment variables"
    );
  }

  await page.goto("/login");

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
