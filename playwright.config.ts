import { defineConfig, devices } from "@playwright/test";

/**
 * E2E-Tests laufen gegen den Platzhalter-Demo-Tenant (siehe
 * server/tenant-context.ts) und brauchen daher eine echte DATABASE_URL
 * (Neon) sowie einen laufenden Dev-Server. `workers: 1`, da alle Tests
 * denselben Tenant teilen und parallele Laeufe sich sonst ueber
 * Kundenlisten/Nummernkreise stoeren koennten.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
