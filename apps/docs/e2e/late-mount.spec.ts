import { test, expect, expectOnly, BASE, withBase } from "./fixtures";

const T = ["quote", "wall"] as const;

// Every time a testimonials version is inserted, record which versions are
// displayed. MutationObserver callbacks run before the next paint, so a
// default-then-switch flash would show up here as ["quote"].
const recordTestimonials = () => {
  const w = window as unknown as { __seen: string[][] };
  w.__seen = [];
  new MutationObserver(() => {
    const els = document.querySelectorAll('[data-switches-name="testimonials"]');
    if (!els.length) return;
    w.__seen.push(
      Array.from(els)
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => el.getAttribute("data-switches-option")!),
    );
  }).observe(document, { childList: true, subtree: true });
};

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("a section mounted by client-side navigation joins the panel", async ({ page }) => {
  await page.goto(withBase("/demo"));
  await page.evaluate(() => ((window as any).__spa = true)); // gone after a full reload
  await page.getByRole("link", { name: "Read customer stories →" }).click();
  await expect(page).toHaveURL(/\/demo\/more/);
  expect(await page.evaluate(() => (window as any).__spa)).toBe(true);
  await expectOnly(page, "testimonials", T, "quote");

  await page.getByRole("button", { name: "Open Switches" }).click();
  const dialog = page.getByRole("dialog", { name: "Switches" });
  const sw = dialog.getByRole("switch", { name: "Testimonials" });
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await expect(dialog.getByRole("radiogroup", { name: "Hero" })).toHaveCount(0);
  await sw.click();
  await expectOnly(page, "testimonials", T, "wall");

  // The pick is recorded against the page it was made on.
  await dialog.getByRole("button", { name: "Copy my picks" }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.split("\n").slice(0, 2)).toEqual([
    "Switches picks: testimonials: wall",
    `testimonials: wall (${BASE}/demo/more)`,
  ]);
});

test("a stored pick for a late section shows on arrival, with no flash", async ({ page }) => {
  await page.goto(withBase("/demo?switches=testimonials:wall"));
  await expect(page.getByRole("button", { name: "Open Switches" })).toBeVisible();
  await page.evaluate(recordTestimonials);
  await page.evaluate(() => ((window as any).__spa = true));

  await page.getByRole("link", { name: "Read customer stories →" }).click();
  await page.getByTestId("testimonials-wall").waitFor({ state: "attached" });
  expect(await page.evaluate(() => (window as any).__spa)).toBe(true);

  // Immediately on arrival, and at every insertion before that, only "wall".
  await expectOnly(page, "testimonials", T, "wall");
  const seen: string[][] = await page.evaluate(() => (window as any).__seen);
  expect(seen.length).toBeGreaterThan(0);
  for (const s of seen) expect(s).toEqual(["wall"]);
});

test("a pick for a section that mounts after load survives a reload, with no flash", async ({ page }) => {
  const L = ["row", "grid"] as const;
  await page.goto(withBase("/demo/more"));
  await page.getByTestId("logos-row").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Open Switches" }).click();
  const dialog = page.getByRole("dialog", { name: "Switches" });
  await dialog.getByRole("switch", { name: "Logos" }).click();
  await expectOnly(page, "logos", L, "grid");
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("switches:v1") || "{}").logos))
    .toEqual({ option: "grid", path: withBase("/demo/more"), seen: true });

  // From the very start of the reloaded document, record the picks attribute
  // and which logos versions are displayed at every change.
  await page.addInitScript(() => {
    const w = window as unknown as { __attrs: (string | null)[]; __logos: string[][] };
    w.__attrs = [];
    w.__logos = [];
    new MutationObserver(() => {
      // From the first value the pick script writes, every value must keep the pick.
      const a = document.documentElement.getAttribute("data-switches-picks");
      if (a !== null || w.__attrs.length) w.__attrs.push(a);
      const els = document.querySelectorAll('[data-switches-name="logos"]');
      if (els.length)
        w.__logos.push(
          Array.from(els)
            .filter((el) => getComputedStyle(el).display !== "none")
            .map((el) => el.getAttribute("data-switches-option")!),
        );
    }).observe(document, { childList: true, subtree: true, attributes: true });
  });
  await page.reload();
  await page.getByTestId("logos-grid").waitFor({ state: "attached" });
  await expectOnly(page, "logos", L, "grid");
  // Let the panel settle after the late mount, then check nothing was lost.
  await page.waitForTimeout(300);
  await expectOnly(page, "logos", L, "grid");

  const { attrs, logos, stored } = await page.evaluate(() => ({
    attrs: (window as any).__attrs as (string | null)[],
    logos: (window as any).__logos as string[][],
    stored: JSON.parse(localStorage.getItem("switches:v1") || "{}"),
  }));
  expect(stored.logos).toEqual({ option: "grid", path: withBase("/demo/more"), seen: true });
  expect(page.url()).toContain("logos%3Agrid");
  expect(attrs.length).toBeGreaterThan(0);
  for (const a of attrs) expect(a).toContain("logos:grid");
  expect(logos.length).toBeGreaterThan(0);
  for (const s of logos) expect(s).toEqual(["grid"]);

  await page.getByRole("button", { name: "Open Switches" }).click();
  await page.getByRole("dialog", { name: "Switches" }).getByRole("button", { name: "Copy my picks" }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain(`logos: grid (${BASE}/demo/more)`);
});

test("a pick whose section is gone for a whole visit is forgotten at visit end", async ({ page }) => {
  await page.goto(withBase("/demo/more"));
  await page.getByTestId("logos-row").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Open Switches" }).click();
  await page.getByRole("dialog", { name: "Switches" }).getByRole("switch", { name: "Logos" }).click();
  await page.getByRole("dialog", { name: "Switches" }).getByRole("switch", { name: "Testimonials" }).click();
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("switches:v1") || "{}"));
  await expect.poll(async () => (await stored()).logos?.seen).toBe(true);
  await expect.poll(async () => (await stored()).testimonials?.seen).toBe(true);

  // The round was applied: the logos Variants are unwrapped, so the same page
  // now has no logos section at all for this whole visit.
  await page.goto(withBase("/demo/more?without=logos"));
  await expect(page.getByTestId("testimonials-wall")).toBeVisible();
  await page.waitForTimeout(800); // longer than any late mount on this page
  await expect(page.getByTestId("logos-row")).toHaveCount(0);
  expect((await stored()).logos).toBeDefined(); // never at the first report
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  const after = await stored();
  expect(after.logos).toBeUndefined();
  expect(after.testimonials).toEqual({ option: "wall", path: withBase("/demo/more"), seen: true });
});
