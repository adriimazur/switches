import type { Page } from "@playwright/test";
import { test, expect, withBase } from "./fixtures";

// The hand-drawn "click here" pointing at the Switches round button (Overview only).

const hint = (page: Page) => page.getByTestId("click-hint");
const hintAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.effect instanceof KeyframeEffect && (a.effect.target as Element | null)?.closest?.(".s-hint")).length,
  );

test("shows on the Overview, points at the round button and never takes clicks", async ({ page }) => {
  await page.goto(withBase("/"));
  await expect(hint(page)).toBeVisible({ timeout: 5000 });
  await expect(hint(page)).toHaveAttribute("aria-hidden", "true");
  await expect(hint(page)).toHaveCSS("pointer-events", "none");
  await expect(hint(page)).toContainText("click here");
  const h = (await hint(page).boundingBox())!;
  const b = (await page.locator(".sw-button").boundingBox())!;
  // Its lower-left corner is at the button's upper-right.
  expect(Math.abs(h.x - (b.x + b.width))).toBeLessThan(16);
  expect(Math.abs(h.y + h.height - b.y)).toBeLessThan(16);
  // Never over the sidebar's navigation or its foot.
  for (const sel of [".s-nav", ".s-side-foot"]) {
    const r = (await page.locator(sel).boundingBox())!;
    const apart = h.x >= r.x + r.width || h.x + h.width <= r.x || h.y >= r.y + r.height || h.y + h.height <= r.y;
    expect(apart, sel).toBe(true);
  }
});

test("is not on the sample site or the docs pages", async ({ page }) => {
  for (const path of ["/demo", "/docs/api"]) {
    await page.goto(withBase(path));
    await expect(page.locator(".sw-button")).toBeVisible();
    await page.waitForTimeout(800);
    await expect(hint(page)).toHaveCount(0);
  }
});

test("goes once the panel is opened, and stays gone after a reload in the same session", async ({ page }) => {
  await page.goto(withBase("/"));
  await expect(hint(page)).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Open Switches" }).click();
  await expect(hint(page)).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem("sw:hint-dismissed"))).toBe("1");
  await page.reload();
  await expect(page.locator(".sw-button")).toBeVisible();
  await page.waitForTimeout(800);
  await expect(hint(page)).toHaveCount(0);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("is drawn in full and holds still", async ({ page }) => {
    await page.goto(withBase("/"));
    await expect(hint(page)).toBeVisible({ timeout: 5000 });
    expect(await hintAnimations(page)).toBe(0);
    const offset = await page.locator(".s-hint-shaft").evaluate((el) => getComputedStyle(el).strokeDashoffset);
    expect(parseFloat(offset)).toBe(0);
  });
});

test("with Calm picked it is drawn in full and holds still", async ({ page }) => {
  await page.goto(withBase("/?switches=animation:calm"));
  await expect(hint(page)).toBeVisible({ timeout: 5000 });
  expect(await hintAnimations(page)).toBe(0);
});

test("with motion it draws in and then sways", async ({ page }) => {
  await page.goto(withBase("/"));
  await expect(hint(page)).toBeVisible({ timeout: 5000 });
  await expect.poll(() => hintAnimations(page)).toBeGreaterThan(0);
});

test.describe("with Full picked while the OS asks for reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("draws in and sways anyway", async ({ page }) => {
    await page.goto(withBase("/?switches=animation:full"));
    await expect(hint(page)).toBeVisible({ timeout: 5000 });
    await expect.poll(() => hintAnimations(page)).toBeGreaterThan(0);
  });
});

type Rect = { x: number; y: number; width: number; height: number };
const apart = (a: Rect, b: Rect) =>
  a.x >= b.x + b.width || a.x + a.width <= b.x || a.y >= b.y + b.height || a.y + a.height <= b.y;
// What the hint must never cover on a phone: the top bar, text blocks, the Try
// it mock, code, and the illustration's drawn round button. The rest of the
// drawing may sit under it.
const KEEP_CLEAR = ".s-side, .s-prose > :not(.il):not(.s-hint), .il .so-live .so-button";
const DRAWN_TEXT = ".il .so-live .so-sheet :is(.so-title, .so-label, .ss-seg__option, .so-copy span)";

async function expectClear(page: Page, where: string) {
  const h = (await hint(page).boundingBox())!;
  const boxes = await page.locator(KEEP_CLEAR).evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, what: `${e.tagName}.${e.className}` };
    }),
  );
  for (const b of boxes) if (b.width && b.height) expect(apart(h, b), `${where}: over ${b.what}`).toBe(true);
}

// soft: whether a spot exists there with the handwritten word's text box off
// the illustration's drawn words while the arrow still ends beside the
// button. At 375, 390 and 393 the drawn panel stands level with the button and
// its rows sit closer together than the word is tall, so only the hard rules
// apply there.
for (const [width, height, soft] of [
  [375, 812, false],
  [390, 844, false],
  [393, 852, false],
  [430, 932, true],
] as const) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height } });

    test("shows on arrival, clear of text, the top bar and the drawn round button", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.locator(".il .so-first")).toHaveCount(0);
      await expect(hint(page)).toBeVisible({ timeout: 5000 });
      await expect(hint(page)).toHaveAttribute("data-visible", "true");
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expectClear(page, "scrollY 0");
      // Soft rule: the handwritten word stays off the words drawn in the
      // illustration's panel (the arrow may cross them).
      if (!soft) return;
      await page.evaluate(() => document.fonts.ready); // the word's box in its own font
      const word = (await page.locator(".s-hint-text").boundingBox())!;
      const drawn = await page.locator(DRAWN_TEXT).evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height, what: e.textContent };
        }),
      );
      expect(drawn.length).toBeGreaterThan(4);
      for (const d of drawn) if (d.width && d.height) expect(apart(word, d), `word over drawn "${d.what}"`).toBe(true);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  });
}

for (const [width, height] of [
  [375, 812],
  [390, 844],
] as const) {
  test.describe(`at ${width}px, scrolling`, () => {
    test.use({ viewport: { width, height } });

    test("stays visible at every step while the illustration is behind the button (no blink)", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.locator(".il .so-first")).toHaveCount(0);
      await expect(hint(page)).toBeVisible({ timeout: 5000 });
      const button = (await page.locator(".sw-button").boundingBox())!;
      // The last scroll position at which the illustration still reaches the button.
      const end = await page.evaluate((top) => {
        const r = document.querySelector(".il")!.getBoundingClientRect();
        return Math.floor(r.bottom + window.scrollY - top);
      }, button.y);
      expect(end).toBeGreaterThan(100);
      for (let y = 0; y <= end; y += 10) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(60);
        await expect(hint(page), `scrollY ${y}`).toHaveAttribute("data-visible", "true", { timeout: 300 });
        await expectClear(page, `scrollY ${y}`);
      }
    });
  });
}

test.describe("at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hides once the page is scrolled past the illustration", async ({ page }) => {
    await page.goto(withBase("/"));
    await expect(hint(page)).toBeVisible({ timeout: 5000 });
    await page.evaluate(() => document.getElementById("install")!.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(500);
    await expect(hint(page)).toBeHidden();
  });

  test("scanning down the page, it shows and never covers text or the drawn round button", async ({ page }) => {
    await page.goto(withBase("/"));
    await expect(page.locator(".sw-button")).toBeVisible();
    await expect(page.locator(".il .so-first")).toHaveCount(0);
    let seen = 0;
    for (let y = 0; y <= 1200; y += 60) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(350); // past the 0.2s fade
      if (!(await hint(page).isVisible())) continue;
      seen++;
      await expectClear(page, `scrollY ${y}`);
    }
    expect(seen, "the hint showed at some point of the scan").toBeGreaterThan(0);
  });
});
