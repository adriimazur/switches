import { test, expect, expectOnly, HEROES } from "./fixtures";

// Runs against the build made with NEXT_PUBLIC_SWITCHES=off (project "switches-off").

test("NEXT_PUBLIC_SWITCHES=off: no panel and only defaults, even with picks", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("switches:v1", JSON.stringify({ footer: { option: "cta", path: "/demo" } }));
  });
  await page.goto("/demo?switches=hero:split,pricing:simple");
  await page.waitForLoadState("networkidle");

  await expect(page.locator(".sw-root, .sw-button, .sw-sheet")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open Switches" })).toHaveCount(0);
  expect(await page.content()).not.toContain("switches:v1"); // no pick script
  await expect(page.locator("html")).not.toHaveAttribute("data-switches-picks");

  await expectOnly(page, "hero", HEROES, "centered");
  await expectOnly(page, "pricing", ["tiers", "simple"], "tiers");
  await expectOnly(page, "footer", ["columns", "compact", "cta"], "columns");
});

test("NEXT_PUBLIC_SWITCHES=off: a late section shows its default", async ({ page }) => {
  await page.goto("/demo/more?switches=testimonials:wall");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".sw-root")).toHaveCount(0);
  await expectOnly(page, "testimonials", ["quote", "wall"], "quote");
});
