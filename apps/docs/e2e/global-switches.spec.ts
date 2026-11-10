import type { Page } from "@playwright/test";
import { test, expect, expectOnly, holdScripts, BASE, withBase } from "./fixtures";

// The site's own global switches (Mode, Accent): sections with no
// content, rendered by the (site) shell, that change the site through
// <html data-switches-picks> (site.css, components/sitePicks.ts).

const DARK_BG = "rgb(17, 17, 17)";
const LIGHT_BG = "rgb(253, 253, 252)";
const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const labels = (page: Page) => page.locator(".sw-sheet .sw-label").allTextContents();

async function openPanel(page: Page) {
  await page.getByRole("button", { name: "Open Switches" }).click();
  return page.getByRole("dialog", { name: "Switches" });
}

test("the panel lists Layout, Mode and Accent on the Overview, in page order", async ({ page }) => {
  await page.goto(withBase("/"));
  const dialog = await openPanel(page);
  expect(await labels(page)).toEqual(["Layout", "Mode", "Accent"]);
  await expect(dialog.getByRole("switch")).toHaveCount(0);
  const radios = (name: string) => dialog.getByRole("radiogroup", { name }).getByRole("radio");
  await expect(radios("Layout")).toHaveText(["Big headline", "Photo split", "Class list"]);
  await expect(radios("Mode")).toHaveText(["Light", "Dark", "System"]);
  await expect(radios("Mode").filter({ hasText: "System" })).toHaveAttribute("aria-checked", "true");
  // Mode is drawn with preset icons, Accent is plain text.
  await expect(radios("Mode").locator("svg.sw-opt-icon")).toHaveCount(3);
  await expect(radios("Accent").locator(".sw-dot, svg")).toHaveCount(0);
  await expect(radios("Accent")).toHaveText(["System", "Black", "Blue", "Orange"]);
  await expect(radios("Accent").filter({ hasText: "System" })).toHaveAttribute("aria-checked", "true");
  // Copy my picks: a copy icon on the left of the black button.
  await expect(dialog.getByRole("button", { name: "Copy my picks" }).locator("svg")).toHaveCount(1);
});

test("the docs pages get the global switches too, the sample site does not", async ({ page }) => {
  await page.goto(withBase("/docs/api"));
  await openPanel(page);
  expect(await labels(page)).toEqual(["Mode", "Accent"]);

  await page.goto(withBase("/demo"));
  await openPanel(page);
  const demo = await labels(page);
  expect(demo.length).toBeGreaterThan(0);
  for (const name of ["Mode", "Accent", "Layout"]) expect(demo).not.toContain(name);
});

test.describe("mode", () => {
  test("picking Dark darkens the site, survives a reload, and doesn't scroll", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(withBase("/"));
    expect(await bodyBg(page)).toBe(LIGHT_BG);
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Dark" }).click();
    await expect.poll(() => bodyBg(page)).toBe(DARK_BG);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    // No section to reveal: nothing scrolls.
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.reload();
    expect(await bodyBg(page)).toBe(DARK_BG);
  });

  test("?switches=mode:dark is dark from first paint, before hydration", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    const release = await holdScripts(page);
    await page.goto(withBase("/?switches=mode:dark"), { waitUntil: "domcontentloaded" });
    await expect(page.locator(".sw-button")).toHaveCount(0); // not hydrated yet
    expect(await bodyBg(page)).toBe(DARK_BG);
    expect(await page.locator(".site").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(DARK_BG);
    release();
    await expect(page.locator(".sw-button")).toBeVisible();
    expect(await bodyBg(page)).toBe(DARK_BG);
  });

  test("mode:light beats a dark OS", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(withBase("/?switches=mode:light"));
    expect(await bodyBg(page)).toBe(LIGHT_BG);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  });

  test("system follows the OS", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(withBase("/?switches=mode:system"));
    expect(await bodyBg(page)).toBe(DARK_BG);
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => bodyBg(page)).toBe(LIGHT_BG);
    await page.goto(withBase("/docs"));
    expect(await bodyBg(page)).toBe(LIGHT_BG);
  });

  test("the illustration and the Try it mock follow a forced mode", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(withBase("/?switches=mode:dark"));
    const surface = await page.getByTestId("layout-headline").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(surface).toBe("rgb(22, 22, 22)");
    const sheet = await page.locator(".il .so-live .so-sheet").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(sheet).toBe("rgb(31, 31, 30)");
  });
});

test.describe("animation", () => {
  // There is no Animation switch in the panel; a link can still ask for it.
  const stage = (page: Page) => page.locator(".il .so-live .ss-stage");

  test("?switches=animation:calm stills the illustration and doesn't scroll", async ({ page }) => {
    await page.goto(withBase("/?switches=animation:calm"));
    await expect(stage(page)).toHaveAttribute("data-still", "true");
    // The poster: Hero on, One plan.
    await expect(page.locator(".il .so-switch")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".il .so-seg .ss-seg__option[data-on]").first()).toHaveText("One plan");
    await expect.poll(() => page.evaluate(() => document.getAnimations().length), { timeout: 3000 }).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the panel has no Animation row", async ({ page }) => {
    await page.goto(withBase("/"));
    const dialog = await openPanel(page);
    await expect(dialog.getByRole("radiogroup", { name: "Animation" })).toHaveCount(0);
  });

  test.describe("when the OS asks for reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("System follows it: the poster, held still", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(stage(page)).toHaveAttribute("data-still", "true");
    });

    test("animation:full in a link plays the illustration anyway", async ({ page }) => {
      await page.goto(withBase("/?switches=animation:full"));
      await expect(stage(page)).not.toHaveAttribute("data-still", /.*/);
      await expect(page.locator(".il .so-switch")).toHaveAttribute("aria-checked", "false", { timeout: 8_000 });
    });
  });
});

test.describe("accent", () => {
  const link = (page: Page) =>
    page.locator(".s-note a").first().evaluate((el) => getComputedStyle(el).color);
  const glaze = (page: Page) =>
    page.getByTestId("layout-headline").locator(".kh-btn").evaluate((el) => getComputedStyle(el).backgroundColor);

  const cases = [
    { option: "system", fill: "rgb(52, 199, 89)" },
    { option: "black", fill: "rgb(17, 17, 17)" },
    { option: "blue", fill: "rgb(37, 99, 235)" },
    { option: "orange", fill: "rgb(194, 65, 12)" },
  ];
  for (const c of cases) {
    test(`accent:${c.option} colours the Try it mock, never the links`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(withBase(`/?switches=accent:${c.option}`));
      expect(await link(page)).toBe("rgb(31, 95, 214)");
      expect(await glaze(page)).toBe(c.fill);
    });
  }

  test("System (green) is the default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(withBase("/"));
    expect(await glaze(page)).toBe("rgb(52, 199, 89)");
  });

  test("the illustration's switch changes colour with the accent", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const track = (p: Page) =>
      p.locator(".il .so-live .so-switch").evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.goto(withBase("/"));
    expect(await track(page)).toBe("rgb(52, 199, 89)");
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Blue" }).click();
    await expect.poll(() => track(page)).toBe("rgb(37, 99, 235)");
    await dialog.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Orange" }).click();
    await expect.poll(() => track(page)).toBe("rgb(194, 65, 12)");
  });

  test("picking an accent in the panel changes it live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(withBase("/"));
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Orange" }).click();
    await expect.poll(() => glaze(page)).toBe("rgb(194, 65, 12)");
    expect(await link(page)).toBe("rgb(31, 95, 214)");
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test("the Layout section still works through a link next to the global picks", async ({ page }) => {
  await page.goto(withBase("/?switches=layout:photo,mode:dark,accent:blue"));
  await expectOnly(page, "layout", ["headline", "photo", "classes"], "photo");
  expect(await bodyBg(page)).toBe(DARK_BG);
});

test.describe("copy", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Copy my picks includes the global picks", async ({ page, baseURL }) => {
    await page.goto(withBase("/"));
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Dark" }).click();
    await dialog.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Blue" }).click();
    await dialog.getByRole("button", { name: "Copy my picks" }).click();
    await expect(dialog.getByRole("button", { name: "Copied" })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const path = BASE || "/";
    expect(text.split("\n")).toEqual([
      "Switches picks: mode: dark · accent: blue",
      `mode: dark (${path})`,
      `accent: blue (${path})`,
      `Link: ${baseURL}${BASE || "/"}?switches=mode%3Adark%2Caccent%3Ablue`,
      "Apply these picks: keep the chosen version of each section and delete the others.",
    ]);
  });
});
