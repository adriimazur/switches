// A sample of the text "Copy my picks" produces, in the exact format of
// formatPicks() in packages/switches/src/core/format.ts: a summary line, one
// line per pick as `name: option (path)` (no path when it has unusual characters)
// with an optional ` — note: …`, the
// share link, and the instruction line.
export const SAMPLE_PICKS = [
  "Switches picks: hero: split · pricing: simple",
  "hero: split (/) — note: bigger headline",
  "pricing: simple (/pricing)",
  "Link: https://preview.example.com/pricing?switches=hero%3Asplit%2Cpricing%3Asimple",
  "Apply these picks: keep the chosen version of each section and delete the others.",
].join("\n");
