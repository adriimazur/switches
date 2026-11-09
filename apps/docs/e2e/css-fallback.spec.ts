import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect } from "@playwright/test";

// The site's colours are light-dark() pairs. Browsers without light-dark()
// (Chrome < 123, Safari < 17.5, Firefox < 120) get a fallback block,
// `@supports not (color: light-dark(...))`, that spells the same values out.
// No browser here lacks light-dark(), so this checks the stylesheets as text:
// every property set with light-dark() has a light and a dark plain value in
// the fallback. No page is opened.

const FILES = ["../app/(site)/site.css", "../app/(site)/components/stage/switches-round.css"];
const FALLBACK = "@supports not (color: light-dark(#000, #fff))";

for (const rel of FILES) {
  test(`light-dark() fallback is complete in ${rel.split("/").pop()}`, () => {
    const css = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
    const at = css.indexOf(FALLBACK);
    expect(at, "fallback block").toBeGreaterThan(-1);
    const main = css.slice(0, at);
    // The fallback block runs to its matching closing brace.
    let depth = 0;
    let end = css.indexOf("{", at);
    for (let i = end; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) {
        end = i;
        break;
      }
    }
    const fallback = css.slice(css.indexOf("{", at) + 1, end);
    const after = css.slice(end + 1);

    const used = new Set(
      [...(main + after).matchAll(/(--[\w-]+|background):\s*light-dark\(/g)].map((m) => m[1]!),
    );
    expect(used.size).toBeGreaterThan(0);
    expect(fallback).not.toMatch(/:\s*light-dark\(/);
    for (const name of used) {
      const plain = [...fallback.matchAll(new RegExp(`(?:^|[\\s;{])${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`, "g"))].map(
        (m) => m[1]!.toLowerCase(),
      );
      expect(plain.length, `${name}: a light and a dark value`).toBeGreaterThanOrEqual(2);
    }
    // The dark values apply under the OS preference and under a forced dark pick.
    expect(fallback).toContain("@media (prefers-color-scheme: dark)");
    expect(fallback).toContain('[data-switches-picks="mode:dark"]');
  });
}
