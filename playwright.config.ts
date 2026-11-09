import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL || "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(process.env.CHROMIUM_PATH
      ? {
          launchOptions: {
            executablePath: process.env.CHROMIUM_PATH,
            args: ["--no-sandbox", "--disable-dev-shm-usage"],
          },
        }
      : {}),
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 4174",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
