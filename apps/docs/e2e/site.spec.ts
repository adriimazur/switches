import { test, expect, expectOnly, holdScripts, BASE, withBase } from "./fixtures";

// The public site: Overview (/) and /docs, in one shell (sidebar + column).

const PAGES = [
  { path: "/", title: "Overview", h1: "Let your client pick the version, on the real site." },
  { path: "/docs", title: "Getting started", h1: "Getting started" },
  { path: "/docs/features", title: "Features", h1: "Features" },
  { path: "/docs/api", title: "API", h1: "API" },
  { path: "/docs/claude-code", title: "Claude Code", h1: "Claude Code" },
  { path: "/docs/faq", title: "FAQ", h1: "FAQ" },
];

const INSTALL = "pnpm add switches-react && npx switches init";
const LAYOUT = ["headline", "photo", "classes"] as const;

test("overview: one h1, the six steps, the sections and the install snippet", async ({ page }) => {
  await page.goto(withBase("/"));
  await expect(page.locator("h1")).toHaveCount(1);

  const steps = page.locator("ol.s-steps > li");
  await expect(steps).toHaveCount(6);
  await expect(steps.locator("b")).toHaveText([
    "AI makes the versions.",
    "Open the shared link.",
    "Flip through them",
    "Pick one per section",
    "Press Copy my picks.",
    "Paste it into Claude Code.",
  ]);

  for (const name of ["How you use it", "How Claude uses it", "Try it", "Install"]) {
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("img", { name: /Switches panel open at the bottom left/ })).toBeVisible();
  await expect(page.getByText(INSTALL).first()).toBeVisible();
  await expect(page.getByText("Remove it before launch.")).toBeVisible();
});

test("overview: no Watch a round section, no legend or number markers", async ({ page }) => {
  await page.goto(withBase("/"));
  await expect(page.getByRole("heading", { name: "Watch a round" })).toHaveCount(0);
  await expect(page.getByText("Demo video coming")).toHaveCount(0);
  await expect(page.locator(".il-legend")).toHaveCount(0);
  await expect(page.locator(".il-marker")).toHaveCount(0);
  await expect(page.locator(".il .so-card")).toHaveCount(4); // pricing versions only: three tiers and one plan
});

test("the wordmark is the switch glyph: a pill track and a knob", async ({ page }) => {
  await page.goto(withBase("/"));
  const mark = page.locator(".s-wordmark svg.s-mark");
  await expect(mark).toHaveCount(1);
  await expect(mark.locator("rect.s-mark-track")).toHaveCount(1);
  await expect(mark.locator("circle.s-mark-knob")).toHaveCount(1);
});

test("the favicon links are in the head, under the base path", async ({ page }) => {
  await page.goto(withBase("/"));
  const svg = page.locator('head link[rel~="icon"][type="image/svg+xml"]');
  await expect(svg).toHaveCount(1);
  expect(await svg.getAttribute("href")).toMatch(new RegExp(`^${BASE}/icon\\.svg`));
  const apple = page.locator('head link[rel="apple-touch-icon"]');
  await expect(apple).toHaveCount(1);
  expect(await apple.getAttribute("href")).toMatch(new RegExp(`^${BASE}/apple-icon\\.png`));
  for (const href of [await svg.getAttribute("href"), await apple.getAttribute("href")]) {
    const res = await page.request.get(href!);
    expect(res.status(), href!).toBe(200);
  }
});

test.describe("the illustration", () => {
  const sw = ".il .so-switch";

  test("animates: the pointer flips the Hero switch and the hero changes version", async ({ page }) => {
    await page.goto(withBase("/"));
    await page.locator(".il").scrollIntoViewIfNeeded();
    // Opens on the poster (Hero on, split), then the script turns it off.
    await expect(page.locator(sw)).toHaveAttribute("aria-checked", "false", { timeout: 8_000 });
    await expect(page.locator(".il .so-hero")).toHaveAttribute("data-version", "0");
    await expect(page.locator(".il .ss-stage")).not.toHaveAttribute("data-still", /.*/);
    // Then the pointer picks Tiers: the segmented control moves and the pricing changes.
    await expect(page.locator(".il .so-seg .ss-seg__option[data-on]").first()).toHaveText("Tiers", { timeout: 10_000 });
    await expect(page.locator(".il .so-pricing")).toHaveAttribute("data-version", "0", { timeout: 10_000 });
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("holds the poster still: no animations, the switch stays on", async ({ page }) => {
      await page.goto(withBase("/"));
      await page.locator(".il").scrollIntoViewIfNeeded();
      await expect(page.locator(".il .ss-stage")).toHaveAttribute("data-still", "true");
      // Sampled over ~1.2s, well past the 0.9s the loop waits before its first click.
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(300);
        await expect(page.locator(sw)).toHaveAttribute("aria-checked", "true");
        await expect(page.locator(".il .so-seg .ss-seg__option[data-on]").first()).toHaveText("One plan");
        const running = await page.evaluate(
          () => document.getAnimations().filter((a) => a.effect instanceof KeyframeEffect && (a.effect.target as Element | null)?.closest?.(".il")).length,
        );
        expect(running).toBe(0);
      }
    });
  });

  test.describe("at 375px", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("plays the phone design, fits the column, no horizontal overflow", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.locator(".il .ss-stage")).toHaveAttribute("data-layout", "compact");
      await expect(page.locator(".il .ss-phone")).toHaveCount(1);
      const box = (await page.locator(".il").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
      // Once live, the first-paint still is gone, and the panel title reads at 11px or more.
      await expect(page.locator(".il .so-first")).toHaveCount(0);
      const title = page.locator(".il .so-live .so-title");
      const px = await title.evaluate((el) => {
        const e = el as HTMLElement;
        return (parseFloat(getComputedStyle(e).fontSize) * e.getBoundingClientRect().width) / e.offsetWidth;
      });
      expect(px).toBeGreaterThanOrEqual(11);
    });
  });

  test.describe("at 360px", () => {
    test.use({ viewport: { width: 360, height: 800 } });

    test("the first-paint still and the live stage are the same size (no jump at hydration)", async ({ page }) => {
      const release = await holdScripts(page);
      await page.goto(withBase("/"), { waitUntil: "domcontentloaded" });
      await expect(page.locator(".il .so-first .ss-phone")).toBeVisible();
      const before = (await page.locator(".il").boundingBox())!.height;
      release();
      await expect(page.locator(".il .so-first")).toHaveCount(0);
      await expect(page.locator(".il .ss-stage")).toHaveAttribute("data-layout", "compact");
      const after = (await page.locator(".il").boundingBox())!.height;
      expect(Math.abs(after - before), `still ${before}px, live ${after}px`).toBeLessThan(8);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over).toBeLessThanOrEqual(0);
      // The phone's panel title reads at 11px or more here too.
      const px = await page.locator(".il .so-live .so-title").evaluate((el) => {
        const e = el as HTMLElement;
        return (parseFloat(getComputedStyle(e).fontSize) * e.getBoundingClientRect().width) / e.offsetWidth;
      });
      expect(px).toBeGreaterThanOrEqual(11);
    });
  });

  test.describe("at 280px without JavaScript", () => {
    test.use({ viewport: { width: 280, height: 640 }, javaScriptEnabled: false });

    test("the phone still fits the column", async ({ page }) => {
      await page.goto(withBase("/"));
      const box = (await page.locator(".il .so-first .ss-stage").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(280 - 16 + 0.5);
    });
  });

  test.describe("at 320px", () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test("the panel title in the phone still reads at 11px or more", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.locator(".il .so-first")).toHaveCount(0);
      const px = await page.locator(".il .so-live .so-title").evaluate((el) => {
        const e = el as HTMLElement;
        return (parseFloat(getComputedStyle(e).fontSize) * e.getBoundingClientRect().width) / e.offsetWidth;
      });
      expect(px).toBeGreaterThanOrEqual(11);
    });
  });

  test.describe("at 375px without JavaScript", () => {
    test.use({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });

    test("shows the phone still, never the wide design cropped", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.locator(".il .so-first .ss-phone")).toBeVisible();
      await expect(page.locator(".il .so-live")).toBeHidden();
      const box = (await page.locator(".il .so-first .ss-stage").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
    });
  });
});

test("try it: one quiet window per version, the same height, no headings in the mock", async ({ page }) => {
  await page.goto(withBase("/?switches=layout:photo"));
  await expect(page.locator(".s-try :is(h1, h2, h3, h4, h5, h6)")).toHaveCount(0);
  await expect(page.locator(".s-try .kh-version").filter({ visible: true })).toHaveText("Version: Photo split");
  const heights: number[] = [];
  for (const o of LAYOUT) {
    await page.goto(withBase(`/?switches=layout:${o}`));
    heights.push(Math.round((await page.getByTestId(`layout-${o}`).boundingBox())!.height));
  }
  expect(new Set(heights).size, `heights ${heights.join(", ")}`).toBe(1);
});

test.describe("copy", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("the install line's copy button copies the install command", async ({ page }) => {
    await page.goto(withBase("/"));
    const button = page.getByRole("button", { name: "Copy install command" });
    await button.click();
    await expect(page.locator(".s-topline [aria-live]")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(INSTALL);
  });
});

test("every page responds and has one h1", async ({ page }) => {
  for (const d of PAGES) {
    const res = await page.goto(withBase(d.path));
    expect(res?.status(), d.path).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(d.h1);
  }
});

test("the sidebar navigates client-side and marks the current page", async ({ page }) => {
  await page.goto(withBase("/"));
  await page.evaluate(() => ((window as any).__spa = true)); // gone after a full reload
  const nav = page.getByRole("navigation", { name: "Site" });
  for (const d of [...PAGES.slice(1), PAGES[0]!]) {
    await nav.getByRole("link", { name: d.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${withBase(d.path)}$`));
    await expect(page.locator("h1")).toHaveText(d.h1);
    await expect(nav.getByRole("link", { name: d.title, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  }
  expect(await page.evaluate(() => (window as any).__spa)).toBe(true);
});

test.describe("at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow on any page", async ({ page }) => {
    for (const { path } of PAGES) {
      await page.goto(withBase(path));
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `${path} overflows by ${over}px`).toBeLessThanOrEqual(0);
    }
  });

  test("the menu opens, closes with Escape and closes on navigation", async ({ page }) => {
    await page.goto(withBase("/"));
    const menu = page.getByRole("button", { name: "Menu" });
    const nav = page.getByRole("navigation", { name: "Site" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toHaveAttribute("aria-controls", "s-nav");
    await expect(page.locator("nav#s-nav")).toHaveCount(1);
    await expect(nav).toBeHidden();

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "FAQ", exact: true }).click();
    await expect(page).toHaveURL(/\/docs\/faq$/);
    await expect(page.locator("h1")).toHaveText("FAQ");
    await expect(nav).toBeHidden();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("main#main")).toBeFocused();
  });
});

test("the try-it section (Layout) switches when a version is picked in the panel", async ({ page }) => {
  await page.goto(withBase("/"));
  await expectOnly(page, "layout", LAYOUT, "headline");

  await page.getByRole("button", { name: "Open Switches" }).click();
  const group = page.getByRole("dialog", { name: "Switches" }).getByRole("radiogroup", { name: "Layout" });
  await group.getByRole("radio", { name: "Photo split" }).click();
  await expectOnly(page, "layout", LAYOUT, "photo");
  await expect(page).toHaveURL(/\?switches=layout%3Aphoto$/);

  await group.getByRole("radio", { name: "Class list" }).click();
  await expectOnly(page, "layout", LAYOUT, "classes");
});

test("the try-it links open the page with a version already picked", async ({ page }) => {
  await page.goto(withBase("/"));
  await page.getByRole("link", { name: "Class list" }).click();
  await expect(page).toHaveURL(new RegExp(`:\\d+${BASE}/?\\?switches=layout(:|%3A)classes$`));
  await expectOnly(page, "layout", LAYOUT, "classes");
});

test("links, styles and scripts stay under the base path", async ({ page }) => {
  const assets: { url: string; status: number }[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/_next/")) assets.push({ url: r.url(), status: r.status() });
  });
  await page.goto(withBase("/"));
  await page.waitForLoadState("networkidle");
  expect(assets.some((a) => a.url.endsWith(".css"))).toBe(true);
  for (const a of assets) {
    expect(a.status, a.url).toBe(200);
    expect(new URL(a.url).pathname.startsWith(`${BASE}/_next/`), a.url).toBe(true);
  }
  // Every same-site link on the page points inside the base path.
  const hrefs = await page.locator("a[href^='/']").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const h of hrefs) expect(h === BASE || h.startsWith(`${BASE}/`) || h.startsWith(`${BASE}?`), h).toBe(true);
  // The site stylesheet applied (the sidebar is a styled sticky column, not a plain list).
  await expect(page.locator(".s-side")).toHaveCSS("position", "sticky");
});

test("try it: the Photo split / Class list links reload with the pick and glide down to the section", async ({ page }) => {
  await page.goto(withBase("/"));
  const link = page.getByRole("link", { name: "Photo split", exact: true });
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await page.waitForURL(/switches=layout%3Aphoto|switches=layout:photo/);
  // The pick applies before first paint, and the page then scrolls to "Try it".
  await expect(page.locator('[data-switches-name="layout"][data-switches-option="photo"]')).toBeVisible();
  await expect(page.locator("#try")).toBeInViewport({ timeout: 10_000 });
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  // The one-shot marker is used up: a plain reload of the page stays where the browser puts it.
  expect(await page.evaluate(() => sessionStorage.getItem("sw:scroll"))).toBeNull();
});

test.describe("the illustration is clickable and can be paused", () => {
  const sw = ".il .so-live .so-switch";
  const plan = ".il .so-live [data-seg=plan] .ss-seg__option";

  test("the pause button stops the loop and the picture can then be clicked", async ({ page }) => {
    await page.goto(withBase("/"));
    const button = page.getByRole("button", { name: "Pause the animation" });
    await button.click();
    await expect(page.getByRole("button", { name: "Play the animation" })).toHaveAttribute("aria-pressed", "true");
    const hero = await page.locator(sw).getAttribute("aria-checked");
    await page.waitForTimeout(2500);
    expect(await page.locator(sw).getAttribute("aria-checked")).toBe(hero); // nothing moves on its own
    await page.locator(sw).click();
    await expect(page.locator(sw)).toHaveAttribute("aria-checked", hero === "true" ? "false" : "true");
    await page.locator(plan).first().click();
    await expect(page.locator(".il .so-live [data-seg=plan] .ss-seg__option[data-on]")).toHaveText("Tiers");
    await expect(page.locator(".il .so-pricing")).toHaveAttribute("data-version", "0");
  });

  test("pressing the picture pauses it too, and Play starts the loop again", async ({ page }) => {
    await page.goto(withBase("/"));
    await page.locator(sw).click();
    await expect(page.getByRole("button", { name: "Play the animation" })).toBeVisible();
    await page.getByRole("button", { name: "Play the animation" }).click();
    await expect(page.getByRole("button", { name: "Pause the animation" })).toBeVisible();
    await expect(page.locator(".il .so-live .ss-stage")).not.toHaveAttribute("data-still", /.*/);
  });

  test("clicking Accent or Mode in the picture changes the real site", async ({ page }) => {
    await page.goto(withBase("/"));
    await page.locator(".il .so-live [data-seg=accent] .ss-seg__option", { hasText: "Blue" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-switches-picks", /accent:blue/);
    await page.locator(".il .so-live [data-seg=mode] .ss-seg__option", { hasText: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-switches-picks", /mode:dark/);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("there is no pause button, and the still can be clicked", async ({ page }) => {
      await page.goto(withBase("/"));
      await expect(page.getByRole("button", { name: /the animation/ })).toHaveCount(0);
      const before = await page.locator(sw).getAttribute("aria-checked");
      await page.locator(sw).click();
      await expect(page.locator(sw)).not.toHaveAttribute("aria-checked", before!);
    });
  });
});
