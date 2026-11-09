import { test, expect, expectOnly, HEROES, BASE, withBase } from "./fixtures";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("pick a hero, add a note, copy the picks, open the link", async ({ page, browser, baseURL }) => {
  await page.goto(withBase("/demo"));
  const open = page.getByRole("button", { name: "Open Switches" });
  await expect(open).toBeVisible();
  await expectOnly(page, "hero", HEROES, "centered");

  // The closed sheet is out of the tab order: tabbing through the whole page
  // never lands inside it.
  const sheet = page.locator(".sw-sheet");
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  const seen = new Set<string>();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const where = await page.evaluate(() => {
      const a = document.activeElement;
      return { inSheet: !!a?.closest(".sw-sheet"), tag: `${a?.tagName}.${a?.className}` };
    });
    expect(where.inSheet, `focus landed in the closed sheet: ${where.tag}`).toBe(false);
    seen.add(where.tag);
  }
  expect([...seen].some((t) => t === "BUTTON.sw-button")).toBe(true); // the button itself is reachable

  await open.click();
  await expect(sheet).toHaveAttribute("aria-hidden", "false");
  const dialog = page.getByRole("dialog", { name: "Switches" });
  const hero = dialog.getByRole("radiogroup", { name: "Hero" });
  await expect(hero.getByRole("radio", { name: "Centered" })).toHaveAttribute("aria-checked", "true");
  await hero.getByRole("radio", { name: "Split" }).click();
  await expect(hero.getByRole("radio", { name: "Split" })).toHaveAttribute("aria-checked", "true");
  await expectOnly(page, "hero", HEROES, "split");

  const heroItem = page.locator(".sw-item").filter({ has: page.getByRole("radiogroup", { name: "Hero" }) });
  await heroItem.getByRole("button", { name: "Add note" }).click();
  await heroItem.getByRole("textbox", { name: "Note for Hero" }).fill("bigger headline");

  await dialog.getByRole("button", { name: "Copy my picks" }).click();
  await expect(dialog.getByRole("button", { name: "Copied" })).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());

  const link = `${baseURL}${BASE}/demo?switches=hero%3Asplit`;
  expect(text).toBe(
    [
      "Switches picks: hero: split",
      `hero: split (${BASE}/demo) — note: bigger headline`,
      `Link: ${link}`,
      "Apply these picks: keep the chosen version of each section and delete the others.",
    ].join("\n"),
  );
  // The address bar carries the same link.
  expect(page.url()).toBe(link);

  // A fresh context (no localStorage) opening the link sees the same hero.
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  const errors: string[] = [];
  other.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await other.goto(link);
  await expectOnly(other, "hero", HEROES, "split");
  await expect(other.getByRole("button", { name: "Open Switches" })).toBeVisible();
  expect(errors).toEqual([]);
  await fresh.close();
});

test("the panel lists every section and switches pricing and footer", async ({ page }) => {
  await page.goto(withBase("/demo"));
  await page.getByRole("button", { name: "Open Switches" }).click();
  const dialog = page.getByRole("dialog", { name: "Switches" });
  await expect(dialog.getByRole("radiogroup", { name: "Hero" })).toBeVisible();
  await expect(dialog.getByRole("radiogroup", { name: "Footer" })).toBeVisible();

  const pricing = dialog.getByRole("switch", { name: "Pricing" });
  await expect(pricing).toHaveAttribute("aria-checked", "false");
  await pricing.click();
  await expectOnly(page, "pricing", ["tiers", "simple"], "simple");

  await dialog.getByRole("radiogroup", { name: "Footer" }).getByRole("radio", { name: "Call to action" }).click();
  await expectOnly(page, "footer", ["columns", "compact", "cta"], "cta");

  // Esc closes; picks survive a reload (localStorage).
  await page.keyboard.press("Escape");
  await expect(page.locator(".sw-sheet")).toHaveAttribute("aria-hidden", "true");
  await page.goto(withBase("/demo"));
  await expectOnly(page, "pricing", ["tiers", "simple"], "simple");
  await expectOnly(page, "footer", ["columns", "compact", "cta"], "cta");
});
