import type { Page } from "@playwright/test";
import { test, expect, expectOnly, holdScripts, BASE, withBase } from "./fixtures";

// The site's own global switches (Mode, Animation, Accent): sections with no
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

test("the panel lists Layout, Mode, Animation and Accent on the Overview, in page order", async ({ page }) => {
  await page.goto(withBase("/"));
  const dialog = await openPanel(page);
  expect(await labels(page)).toEqual(["Layout", "Mode", "Animation", "Accent"]);
  await expect(dialog.getByRole("switch")).toHaveCount(0);
  const radios = (name: string) => dialog.getByRole("radiogroup", { name }).getByRole("radio");
  await expect(radios("Layout")).toHaveText(["Big headline", "Photo split", "Class list"]);
  await expect(radios("Mode")).toHaveText(["System", "Light", "Dark"]);
  await expect(radios("Animation")).toHaveText(["System", "Full", "Calm"]);
  await expect(radios("Animation").filter({ hasText: "System" })).toHaveAttribute("aria-checked", "true");
  await expect(radios("Accent")).toHaveText(["Blue", "Green", "Orange"]);
});

test("the docs pages get the global switches too, the sample site does not", async ({ page }) => {
  await page.goto(withBase("/docs/api"));
  await openPanel(page);
  expect(await labels(page)).toEqual(["Mode", "Animation", "Accent"]);

  await page.goto(withBase("/demo"));
  await openPanel(page);
  const demo = await labels(page);
  expect(demo.length).toBeGreaterThan(0);
  for (const name of ["Animation", "Mode", "Accent", "Layout"]) expect(demo).not.toContain(name);
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
  const stage = (page: Page) => page.locator(".il .so-live .ss-stage");
  const animation = (dialog: ReturnType<Page["getByRole"]>, name: string) =>
    dialog.getByRole("radiogroup", { name: "Animation" }).getByRole("radio", { name, exact: true });

  test("Calm stops the illustration's loop live, without a reload, and doesn't scroll", async ({ page }) => {
    await page.goto(withBase("/"));
    await expect(stage(page)).not.toHaveAttribute("data-still", /.*/);
    const dialog = await openPanel(page);
    await animation(dialog, "Calm").click();
    await expect(page.locator("html")).toHaveAttribute("data-switches-picks", /(^|,)animation:calm(,|$)/);
    await expect(stage(page)).toHaveAttribute("data-still", "true");
    // The poster: Hero on, One plan.
    await expect(page.locator(".il .so-switch")).toHaveAttribute("aria-checked", "true");
    await expect(page.locator(".il .so-seg .ss-seg__option[data-on]")).toHaveText("One plan");
    await expect.poll(() => page.evaluate(() => document.getAnimations().length), { timeout: 3000 }).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Back to System: the loop runs again.
    await animation(dialog, "System").click();
    await expect(stage(page)).not.toHaveAttribute("data-still", /.*/);
  });

  test.describe("when the OS asks for reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("System follows it: the poster, held still", async ({ page }) => {
      await page.goto(withBase("/?switches=animation:system"));
      await expect(stage(page)).toHaveAttribute("data-still", "true");
    });

    test("Full, picked in the panel, plays the illustration and the hint anyway", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(stage(page)).toHaveAttribute("data-still", "true");
      const dialog = await openPanel(page);
      await animation(dialog, "Full").click();
      await expect(stage(page)).not.toHaveAttribute("data-still", /.*/);
      await expect(page.locator(".il .so-switch")).toHaveAttribute("aria-checked", "false", { timeout: 8_000 });
      // The pick survives a reload.
      await page.reload();
      await expect(stage(page)).not.toHaveAttribute("data-still", /.*/);
    });
  });
});

test.describe("accent", () => {
  const link = (page: Page) =>
    page.locator(".s-note a").first().evaluate((el) => getComputedStyle(el).color);
  const glaze = (page: Page) =>
    page.getByTestId("layout-headline").locator(".kh-btn").evaluate((el) => getComputedStyle(el).backgroundColor);

  const cases = [
    { option: "blue", link: "rgb(31, 95, 214)", fill: "rgb(37, 99, 235)" },
    { option: "green", link: "rgb(23, 114, 69)", fill: "rgb(21, 128, 61)" },
    { option: "orange", link: "rgb(178, 60, 10)", fill: "rgb(194, 65, 12)" },
  ];
  for (const c of cases) {
    test(`accent:${c.option} colours links and the Try it mock`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto(withBase(`/?switches=accent:${c.option}`));
      expect(await link(page)).toBe(c.link);
      expect(await glaze(page)).toBe(c.fill);
    });
  }

  test("picking an accent in the panel changes it live", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(withBase("/"));
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Accent" }).getByRole("radio", { name: "Orange" }).click();
    await expect.poll(() => glaze(page)).toBe("rgb(194, 65, 12)");
    expect(await link(page)).toBe("rgb(178, 60, 10)");
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test("the Layout section still works through a link next to the global picks", async ({ page }) => {
  await page.goto(withBase("/?switches=layout:photo,mode:dark,accent:green"));
  await expectOnly(page, "layout", ["headline", "photo", "classes"], "photo");
  expect(await bodyBg(page)).toBe(DARK_BG);
});

test.describe("copy", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Copy my picks includes the global picks", async ({ page, baseURL }) => {
    await page.goto(withBase("/"));
    const dialog = await openPanel(page);
    await dialog.getByRole("radiogroup", { name: "Mode" }).getByRole("radio", { name: "Dark" }).click();
    await dialog.getByRole("radiogroup", { name: "Animation" }).getByRole("radio", { name: "Calm" }).click();
    await dialog.getByRole("button", { name: "Copy my picks" }).click();
    await expect(dialog.getByRole("button", { name: "Copied" })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const path = BASE || "/";
    expect(text.split("\n")).toEqual([
      "Switches picks: mode: dark · animation: calm",
      `mode: dark (${path})`,
      `animation: calm (${path})`,
      `Link: ${baseURL}${BASE || "/"}?switches=mode%3Adark%2Canimation%3Acalm`,
      "Apply these picks: keep the chosen version of each section and delete the others.",
    ]);
  });
});
