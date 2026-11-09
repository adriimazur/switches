import { test as base, expect, type Page } from "@playwright/test";

/**
 * `test` that fails if the page logs a console error/warning or throws
 * (hydration mismatches surface as console errors in React 19).
 */
export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: [
    async ({ context }, use) => {
      const problems: string[] = [];
      const watch = (page: Page) => {
        page.on("console", (m) => {
          if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text()}`);
        });
        page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      };
      context.pages().forEach(watch);
      context.on("page", watch);
      await use(problems);
      expect(problems, "console errors/warnings").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/**
 * The docs app's basePath in this run: "" (root mode) or "/switches"
 * (`DOCS_BASE_PATH=/switches`, see playwright.config.ts). Specs go through it
 * for every `goto` and URL assertion so the same specs cover both modes.
 */
export const BASE = process.env.DOCS_BASE_PATH ?? "";

/** `path` under BASE. "/" maps to BASE itself, as Next serves "/switches", not "/switches/". */
export function withBase(path: string): string {
  if (!BASE) return path;
  return path === "/" || path.startsWith("/?") || path.startsWith("/#") ? BASE + path.slice(1) : BASE + path;
}

export const HEROES = ["centered", "split", "minimal"] as const;

/** Assert exactly `shown` of `options` is visible for a section's testids. */
export async function expectOnly(page: Page, section: string, options: readonly string[], shown: string) {
  for (const o of options) {
    const el = page.getByTestId(`${section}-${o}`);
    if (o === shown) await expect(el).toBeVisible();
    else await expect(el).toBeHidden();
  }
}

/**
 * Hold every Next.js JS chunk until `release()` is called, so assertions run
 * against the server HTML + inline script only (before hydration).
 */
export async function holdScripts(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/_next/static/**/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}
