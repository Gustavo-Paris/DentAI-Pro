import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authFile = join(__dirname, "e2e/.auth/user.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },


  projects: [
    // Auth setup — runs once before all tests
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Main tests — depend on auth setup
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
