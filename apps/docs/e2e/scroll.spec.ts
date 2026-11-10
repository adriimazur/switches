import { test, expect, withBase } from "./fixtures";
import type { Page } from "@playwright/test";

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

async function openDemo(page: Page) {
  await page.goto(withBase("/demo"));
  expect(await scrollY(page)).toBe(0);
  await page.getByRole("button", { name: "Open Switches" }).click();
  return page.getByRole("dialog", { name: "Switches" });
}

test("picking a footer version below the fold scrolls down to it", async ({ page }) => {
  const dialog = await openDemo(page);
  await dialog.getByRole("radiogroup", { name: "Footer" }).getByRole("radio", { name: "Compact" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await expect(page.getByTestId("footer-compact")).toBeInViewport({ timeout: 2000 });
  // The sheet stays open.
  await expect(page.locator(".sw-sheet")).toHaveAttribute("aria-hidden", "false");
});

test("flipping the pricing switch scrolls to pricing", async ({ page }) => {
  const dialog = await openDemo(page);
  await dialog.getByRole("switch", { name: "Pricing" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await expect(page.getByTestId("pricing-simple")).toBeInViewport({ timeout: 2000 });
});

test("picking a version of a section already on screen does not scroll", async ({ page }) => {
  const dialog = await openDemo(page);
  const hero = dialog.getByRole("radiogroup", { name: "Hero" });
  await hero.getByRole("radio", { name: "Minimal" }).click();
  await expect(page.getByTestId("hero-minimal")).toBeVisible();
  // Give a (wrong) smooth scroll time to start.
  await page.waitForTimeout(600);
  expect(await scrollY(page)).toBe(0);
});

test("with reduced motion the page still jumps to the section", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dialog = await openDemo(page);
  await dialog.getByRole("radiogroup", { name: "Footer" }).getByRole("radio", { name: "Call to action" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await expect(page.getByTestId("footer-cta")).toBeInViewport({ timeout: 2000 });
});

test("typing a note never scrolls", async ({ page }) => {
  const dialog = await openDemo(page);
  const footer = page.locator(".sw-item").filter({ has: page.getByRole("radiogroup", { name: "Footer" }) });
  await footer.getByRole("button", { name: "Add note" }).click();
  await footer.getByRole("textbox", { name: "Note for Footer" }).fill("darker");
  await page.waitForTimeout(600);
  expect(await scrollY(page)).toBe(0);
});

/** Wait until scrollY has held still for ~300ms (a smooth scroll has ended). */
async function settle(page: Page) {
  let last = Number.NaN;
  let still = 0;
  await expect
    .poll(
      async () => {
        const y = await scrollY(page);
        still = y === last ? still + 1 : 0;
        last = y;
        return still;
      },
      { timeout: 5000, intervals: [100] },
    )
    .toBeGreaterThanOrEqual(3);
}

test("rapid clicks: a footer pick then a hero pick settles at the hero", async ({ page }) => {
  const dialog = await openDemo(page);
  await dialog.getByRole("radiogroup", { name: "Footer" }).getByRole("radio", { name: "Compact" }).click();
  // The footer scroll has really started (so the hero click lands mid-flight)...
  await expect.poll(() => scrollY(page), { timeout: 2000, intervals: [16] }).toBeGreaterThan(0);
  await dialog.getByRole("radiogroup", { name: "Hero" }).getByRole("radio", { name: "Split" }).click();
  await settle(page);
  expect(await scrollY(page)).toBeLessThan(200);
  await expect(page.getByTestId("hero-split")).toBeInViewport();
  await expect(page.getByTestId("footer-compact")).not.toBeInViewport();
});

test("clicking the already selected footer option still scrolls to the footer", async ({ page }) => {
  const dialog = await openDemo(page);
  const columns = dialog.getByRole("radiogroup", { name: "Footer" }).getByRole("radio", { name: "Columns" });
  await expect(columns).toHaveAttribute("aria-checked", "true");
  await columns.click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await settle(page);
  await expect(page.getByTestId("footer-columns")).toBeInViewport();
});

test("clicking the option that is already the pick scrolls without writing the pick or the URL", async ({ page }) => {
  await page.goto(withBase("/demo?switches=footer:columns"));
  expect(await scrollY(page)).toBe(0);
  await page.getByRole("button", { name: "Open Switches" }).click();
  const columns = page
    .getByRole("dialog", { name: "Switches" })
    .getByRole("radiogroup", { name: "Footer" })
    .getByRole("radio", { name: "Columns" });
  await expect(columns).toHaveAttribute("aria-checked", "true");
  const snapshot = () => page.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
  const before = { url: page.url(), stored: await snapshot() };
  await columns.click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await settle(page);
  await expect(page.getByTestId("footer-columns")).toBeInViewport();
  expect(page.url()).toBe(before.url);
  expect(await snapshot()).toBe(before.stored);
});

test("on a phone the picked section ends up above the open sheet", async ({ page }) => {
  // Tall enough for the whole 288px card between the top bar and the open
  // sheet: on the site the sheet also holds the Mode and Accent
  // rows (about 645px tall). The 375x812 case below checks the card's top.
  await page.setViewportSize({ width: 375, height: 1080 });
  await page.goto(withBase("/"));
  await page.getByRole("button", { name: "Open Switches" }).click();
  await page.getByRole("dialog", { name: "Switches" }).getByRole("radio", { name: "Class list" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await settle(page);
  const card = await page.getByTestId("layout-classes").boundingBox();
  const sheet = await page.locator(".sw-sheet").boundingBox();
  expect(card && sheet).toBeTruthy();
  // ...and below the site's sticky top bar (the sidebar becomes one on phones).
  const bar = await page.locator(".s-side").boundingBox();
  expect(card!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
  expect(card!.y + card!.height).toBeLessThanOrEqual(sheet!.y);
});

test("on a 375x812 phone at least the picked card's top (its chrome and version pill) is above the open sheet", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(withBase("/"));
  await page.getByRole("button", { name: "Open Switches" }).click();
  await page.getByRole("dialog", { name: "Switches" }).getByRole("radio", { name: "Class list" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await settle(page);
  const chrome = (await page.getByTestId("layout-classes").locator(".kh-chrome").boundingBox())!;
  const pill = (await page.getByTestId("layout-classes").locator(".kh-version").boundingBox())!;
  const sheet = (await page.locator(".sw-sheet").boundingBox())!;
  const bar = (await page.locator(".s-side").boundingBox())!;
  expect(chrome.y).toBeGreaterThanOrEqual(bar.y + bar.height);
  expect(chrome.y + chrome.height).toBeLessThanOrEqual(sheet.y);
  expect(pill.y + pill.height).toBeLessThanOrEqual(sheet.y);
});

test("a fixed header does not cover the section scrolled to", async ({ page }) => {
  await page.goto(withBase("/demo"));
  await page.addStyleTag({
    // A version taller than the viewport is aligned by its top: the case a
    // fixed header would cover.
    content:
      "header{position:fixed;top:0;left:0;right:0;height:64px;background:#000;z-index:50}" +
      "[data-testid=pricing-simple]{min-height:900px}",
  });
  await page.getByRole("button", { name: "Open Switches" }).click();
  const dialog = page.getByRole("dialog", { name: "Switches" });
  await dialog.getByRole("switch", { name: "Pricing" }).click();
  await expect.poll(() => scrollY(page), { timeout: 2000 }).toBeGreaterThan(200);
  await settle(page);
  const box = await page.getByTestId("pricing-simple").boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(64);
  expect(box!.y).toBeLessThan(200);
});
