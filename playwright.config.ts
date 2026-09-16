import { defineConfig, devices } from "@playwright/test";

const PUERTO = Number(process.env.E2E_PUERTO ?? 3210);
const BASE = process.env.E2E_URL ?? `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-US",
    timezoneId: "America/New_York",
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
  ],
  // Contra un sitio ya publicado (E2E_URL) no se levanta servidor local.
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: `npx next dev -p ${PUERTO}`,
        url: BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: { TINTORA_PERSISTENCIA: ".wrangler/e2e" },
      },
});
