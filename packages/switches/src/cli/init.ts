/// <reference types="node" />
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { claudeBlock, END, MODES, START, type Mode } from "./templates/claude-block";
import { skillMd } from "./templates/skill";

export type { Mode };
export { MODES };

export function isMode(v: string): v is Mode {
  return (MODES as readonly string[]).includes(v);
}

const paths = (dir: string) => {
  const skillDir = join(dir, ".claude", "skills", "switches");
  return { skillDir, skill: join(skillDir, "SKILL.md"), claudeMd: join(dir, "CLAUDE.md") };
};

type Located = { start: number; end: number } | null;

/**
 * Where the Switches block is, as [start of START, end of END). Throws on
 * anything but zero or one well-formed block: guessing would risk deleting
 * the user's own text.
 */
function locate(text: string, file: string): Located {
  const starts = occurrences(text, START);
  const ends = occurrences(text, END);
  if (starts.length === 0 && ends.length === 0) return null;
  const s = starts[0];
  const e = ends[0];
  if (starts.length !== 1 || ends.length !== 1 || s === undefined || e === undefined || e < s) {
    throw new Error(
      `${file} has a broken Switches block (found ${starts.length} "${START}" and ${ends.length} "${END}"). ` +
        `Fix it by hand so there is exactly one start marker followed by one end marker, or remove both, then run this again.`,
    );
  }
  return { start: s, end: e + END.length };
}

function occurrences(text: string, sub: string): number[] {
  const out: number[] = [];
  for (let i = text.indexOf(sub); i !== -1; i = text.indexOf(sub, i + sub.length)) out.push(i);
  return out;
}

function readIfExists(file: string): string | null {
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

export function init(dir: string, opts: { mode: Mode }): { skill: string; claudeMd: string } {
  if (!isMode(opts.mode)) {
    throw new Error(`Unknown mode "${String(opts.mode)}". Use one of: ${MODES.join(", ")}.`);
  }
  const p = paths(dir);
  const block = claudeBlock(opts.mode);
  const current = readIfExists(p.claudeMd);

  // Work out the new CLAUDE.md before touching the disk, so a broken block
  // leaves everything as it was.
  let next: string;
  if (current === null || current === "") {
    next = block + "\n";
  } else {
    const at = locate(current, p.claudeMd);
    if (at) {
      next = current.slice(0, at.start) + block + current.slice(at.end);
    } else {
      const sep = current.endsWith("\n") ? "\n" : "\n\n";
      next = current + sep + block + "\n";
    }
  }

  mkdirSync(p.skillDir, { recursive: true });
  writeFileSync(p.skill, skillMd);
  if (next !== current) writeFileSync(p.claudeMd, next);
  return { skill: p.skill, claudeMd: p.claudeMd };
}

export function uninit(dir: string): void {
  const p = paths(dir);
  const current = readIfExists(p.claudeMd);
  const at = current === null ? null : locate(current, p.claudeMd);

  if (current !== null && at) {
    let before = current.slice(0, at.start);
    let after = current.slice(at.end).replace(/^\r?\n/, "");
    // init put the block on its own lines after a blank line; take one blank
    // line with it so the surrounding text closes up.
    if (/\n\r?\n$/.test(before) && /^\r?\n/.test(after)) after = after.replace(/^\r?\n/, "");
    if (after === "") before = before.replace(/\s+$/, "") + (before.trim() ? "\n" : "");
    const next = before + after;
    if (next.trim() === "") rmSync(p.claudeMd);
    else writeFileSync(p.claudeMd, next);
  }

  rmSync(p.skillDir, { recursive: true, force: true });
  // Tidy the folders init may have created, only if nothing else is in them.
  for (const d of [join(dir, ".claude", "skills"), join(dir, ".claude")]) {
    if (existsSync(d) && readdirSync(d).length === 0) rmdirSync(d);
  }
}
