// The block `npx switches init` keeps in the project's CLAUDE.md. Only the text
// between the markers is ever rewritten; the mode line is the setting.

export type Mode = "off" | "ask" | "always";

export const MODES: readonly Mode[] = ["off", "ask", "always"];
export const START = "<!-- switches:start -->";
export const END = "<!-- switches:end -->";

const RULES: Record<Mode, string> = {
  off: "Build one version of each section unless the user asks for several. When they do, build them as Switches versions (see the `switches` skill).",
  ask: 'Before building a new section or page layout (not small edits, fixes or copy changes), ask once per new section or layout: "want 3 versions?" If yes, build them as Switches versions (see the `switches` skill); if no, build one.',
  always:
    "When building a new section or page layout (not small edits, fixes or copy changes), build 2-3 versions automatically, genuinely different ones, as Switches versions (see the `switches` skill). Do not ask first. Small edits stay one version.",
};

export function claudeBlock(mode: Mode): string {
  return [
    START,
    "## Switches",
    "",
    `Switches version-first mode: ${mode}`,
    "",
    RULES[mode],
    "",
    "Modes: off, ask, always. Edit the line above or run `npx --no-install switches init --mode <mode>`. Picks pasted as `Switches picks: ...` and requests to finish or remove Switches follow the `switches` skill.",
    END,
  ].join("\n");
}
