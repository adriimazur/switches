import { defineConfig, devices } from "@playwright/test";

// The same specs run in two modes, one Playwright run each (`pnpm e2e` does both):
//
// - root mode (default): two production builds of this app, the normal one
//   (port 3217) and one built and started with NEXT_PUBLIC_SWITCHES=off
//   (port 3218, its own distDir);
// - sub-path mode (DOCS_BASE_PATH=/switches, `pnpm e2e:base`): one build served
//   under the basePath /switches (port 3219, distDir .next-base), the way the
//   site runs at https://mazur.design/switches. The off-flag project is root
//   mode only.
//
// Specs read the same DOCS_BASE_PATH through BASE / withBase() in e2e/fixtures.ts.
// `pnpm e2e` builds the switches-react package first; Playwright builds the apps.
const BASE = process.env.DOCS_BASE_PATH ?? "";
const ON = 3217;
const OFF = 3218;
const SUB = 3219;

const server = (port: number, env: Record<string, string>, ready: string) => ({
  command: `next build && next start -p ${port}`,
  url: `http://localhost:${port}${ready}`,
  env: { NEXT_TELEMETRY_DISABLED: "1", ...env },
  reuseExistingServer: false,
  timeout: 240_000,
  stdout: "ignore" as const,
  stderr: "pipe" as const,
});

const chrome = (port: number) => ({ ...devices["Desktop Chrome"], baseURL: `http://localhost:${port}` });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: { trace: "retain-on-failure" },
  projects: BASE
    ? [{ name: "switches-on-subpath", testIgnore: /off-flag\.spec\.ts/, use: chrome(SUB) }]
    : [
        { name: "switches-on", testIgnore: /off-flag\.spec\.ts/, use: chrome(ON) },
        { name: "switches-off", testMatch: /off-flag\.spec\.ts/, use: chrome(OFF) },
      ],
  webServer: BASE
    ? [server(SUB, { DOCS_BASE_PATH: BASE, NEXT_DIST_DIR: ".next-base" }, `${BASE}/demo`)]
    : [
        server(ON, {}, "/demo"),
        server(OFF, { NEXT_PUBLIC_SWITCHES: "off", NEXT_DIST_DIR: ".next-off" }, "/demo"),
      ],
});
