/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { init, isMode, MODES, uninit, type Mode } from "./init";
import { START } from "./templates/claude-block";

export type IO = { out: (line: string) => void; err: (line: string) => void };

const USAGE = [
  "Usage:",
  `  npx switches init [--mode ${MODES.join("|")}]   add the Claude Code skill and CLAUDE.md block (default mode: ask)`,
  "  npx switches uninit                       remove them",
].join("\n");

/** Runs the CLI against `cwd` and returns the exit code. */
export function main(args: string[], cwd: string, io: IO): number {
  const [command, ...rest] = args;
  if (command === "--help" || command === "-h" || command === "help") {
    io.out(USAGE);
    return 0;
  }
  try {
    if (command === "init") {
      const mode = parseMode(rest);
      const r = init(cwd, { mode });
      io.out(
        `Wrote ${relative(cwd, r.skill)} and the Switches block in ${relative(cwd, r.claudeMd)} (version-first mode: ${mode}).`,
      );
      io.out("Next: Add <Switches /> as the first child of <body> in your root layout (app/layout.tsx in Next.js).");
      io.out("In a Next.js App Router project, also use <html suppressHydrationWarning> in app/layout.tsx (the pick script sets one attribute on <html>).");
      io.out("Make sure `switches-react` is in your package.json dependencies (npm i switches-react, pnpm add switches-react or yarn add switches-react).");
      return 0;
    }
    if (command === "uninit") {
      if (rest.length) throw new UsageError(`Unknown option "${rest[0]}".`);
      const claudeMd = join(cwd, "CLAUDE.md");
      const hadSkill = existsSync(join(cwd, ".claude", "skills", "switches"));
      const hadBlock = existsSync(claudeMd) && readFileSync(claudeMd, "utf8").includes(START);
      uninit(cwd);
      const removed = [
        hadSkill && ".claude/skills/switches",
        hadBlock &&
          (existsSync(claudeMd)
            ? "the Switches block in CLAUDE.md"
            : "CLAUDE.md (it held only the Switches block)"),
      ].filter(Boolean);
      io.out(removed.length ? `Removed ${removed.join(" and ")}.` : "Nothing to remove: no Switches setup found here.");
      return 0;
    }
    throw new UsageError(command ? `Unknown command "${command}".` : "Missing command.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    io.err(`switches: ${msg}`);
    if (e instanceof UsageError) io.err(USAGE);
    return 1;
  }
}

class UsageError extends Error {}

function parseMode(args: string[]): Mode {
  let mode: string = "ask";
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--mode") {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`--mode needs a value: ${MODES.join(", ")}.`);
      mode = v;
    } else if (a.startsWith("--mode=")) {
      mode = a.slice("--mode=".length);
    } else {
      throw new UsageError(`Unknown option "${a}".`);
    }
  }
  if (!isMode(mode)) throw new UsageError(`Unknown mode "${mode}". Use one of: ${MODES.join(", ")}.`);
  return mode;
}
