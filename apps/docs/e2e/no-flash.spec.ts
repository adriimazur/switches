import { test, expect, expectOnly, holdScripts, HEROES, withBase } from "./fixtures";

// Records, the moment the first Variant wrapper is parsed into the DOM, what
// <html data-switches-picks> holds and which hero versions are displayed. A
// MutationObserver callback runs before the browser can paint those nodes.
const recordFirstVariant = () => {
  const w = window as unknown as { __first?: { picks: string | null; shown: string[] } };
  new MutationObserver((_, mo) => {
    const heroes = document.querySelectorAll('[data-switches-name="hero"]');
    if (heroes.length < 3) return; // wait until all three versions are parsed
    mo.disconnect();
    w.__first = {
      picks: document.documentElement.getAttribute("data-switches-picks"),
      shown: Array.from(heroes)
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.getAttribute("data-switches-option")!),
    };
  }).observe(document, { childList: true, subtree: true });
};

test("a ?switches= pick is applied before hydration, with no flash", async ({ page }) => {
  await page.addInitScript(recordFirstVariant);
  const release = await holdScripts(page);
  await page.goto(withBase("/demo?switches=hero:split"), { waitUntil: "domcontentloaded" });

  // Not hydrated yet: the panel renders only on the client.
  await expect(page.locator(".sw-button")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__first)).toEqual({
    picks: "hero:split",
    shown: ["split"],
  });
  await expectOnly(page, "hero", HEROES, "split");
  await expectOnly(page, "pricing", ["tiers", "simple"], "tiers");
  await expectOnly(page, "footer", ["columns", "compact", "cta"], "columns");

  // After hydration nothing moves.
  release();
  await expect(page.locator(".sw-button")).toBeVisible();
  await expectOnly(page, "hero", HEROES, "split");
});

test("with no pick the default version shows before hydration", async ({ page }) => {
  await page.addInitScript(recordFirstVariant);
  const release = await holdScripts(page);
  await page.goto(withBase("/demo"), { waitUntil: "domcontentloaded" });

  await expect(page.locator(".sw-button")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).__first)).toEqual({
    picks: null,
    shown: ["centered"],
  });
  await expectOnly(page, "hero", HEROES, "centered");
  await expectOnly(page, "footer", ["columns", "compact", "cta"], "columns");

  release();
  await expect(page.locator(".sw-button")).toBeVisible();
  await expectOnly(page, "hero", HEROES, "centered");
  await expect(page.locator("html")).not.toHaveAttribute("data-switches-picks");
});

test("a pick saved in localStorage is applied before hydration", async ({ page }) => {
  await page.addInitScript((path) => {
    localStorage.setItem("switches:v1", JSON.stringify({ hero: { option: "minimal", path } }));
  }, withBase("/demo"));
  const release = await holdScripts(page);
  await page.goto(withBase("/demo"), { waitUntil: "domcontentloaded" });
  await expect(page.locator(".sw-button")).toHaveCount(0);
  await expectOnly(page, "hero", HEROES, "minimal");
  release();
  await expect(page.locator(".sw-button")).toBeVisible();
  await expectOnly(page, "hero", HEROES, "minimal");
});
