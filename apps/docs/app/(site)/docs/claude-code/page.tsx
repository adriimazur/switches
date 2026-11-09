import type { Metadata } from "next";
import { PRODUCT_NAME } from "../../../site";
import Link from "next/link";
import { Code } from "../../components/Code";
import { SAMPLE_PICKS } from "../../sample";
import { Pager } from "../Pager";

export const metadata: Metadata = { title: `Claude Code · ${PRODUCT_NAME} docs` };

export default function ClaudeCode() {
  return (
    <>
      <h1>Claude Code</h1>
      <p className="s-intro">
        <code>npx switches init</code> installs a Claude Code skill that gives Claude three jobs: make versions, apply
        picks, and finish. You talk to it in plain words; these are examples, not commands to memorise.
      </p>

      <h2 id="versions">1. Make versions</h2>
      <Code label="Claude Code">{`Make 3 versions of the hero.
Give me two options for the pricing section: tiers and a single plan.`}</Code>
      <p>Claude wraps each version in a <code>&lt;Variant&gt;</code> and follows a few rules:</p>
      <ul>
        <li>if the section already exists, the current design stays as one version, marked <code>default</code>;</li>
        <li>versions are genuinely different in layout or approach, not colour or wording tweaks;</li>
        <li>versions get names that describe them (<code>phone</code>, <code>split</code>), never A, B, C;</li>
        <li>each version keeps its own code, so the ones not picked can be deleted cleanly later;</li>
        <li>
          if <code>&lt;Switches /&gt;</code> is not in the layout yet, Claude adds it.
        </li>
      </ul>
      <p>It then tells you the section and version names to look for in the panel.</p>

      <h2 id="apply">2. Apply picks</h2>
      <p>Paste the text from “Copy my picks” as it is. It looks like this:</p>
      <Code label="Clipboard" wrap>{SAMPLE_PICKS}</Code>
      <ul>
        <li>The first line is a summary.</li>
        <li>
          Each next line is one pick: <code>section: version (page)</code>, then <code>— note: …</code> if the picker
          wrote one.
        </li>
        <li>The link is for people; Claude ignores it.</li>
        <li>The last line tells Claude what to do.</li>
      </ul>
      <p>
        For each pick, Claude finds the section in your code, keeps the picked version, deletes the others along with
        code and files only they used, and applies the note as a small tweak. The picker has decided, so it does not ask
        which version to keep; it asks only if a name, option or note looks wrong or unsafe. If a section or version can’t be found, it says so rather than guessing. Afterwards it runs
        the build and reports what it kept, deleted and changed.
      </p>

      <h2 id="finish">3. Finish</h2>
      <p>When the design is settled and you are ready to launch:</p>
      <Code label="Claude Code">Finish Switches.</Code>
      <p>Claude only does this when you ask. It:</p>
      <ol>
        <li>
          removes <code>&lt;Switches /&gt;</code> and its import (and <code>suppressHydrationWarning</code> if it was
          added for Switches);
        </li>
        <li>keeps the default version of any section still undecided, and tells you which;</li>
        <li>
          runs <code>npx --no-install switches uninit</code> (never a bare <code>npx</code> call, which could fetch an unrelated package), which removes the skill and the block in <code>CLAUDE.md</code>;
        </li>
        <li>uninstalls the package and removes any <code>NEXT_PUBLIC_SWITCHES</code> setting;</li>
        <li>runs the production build and checks that no trace of Switches is left.</li>
      </ol>

      <h2 id="modes">Version-first modes</h2>
      <p>
        The Switches block in <code>CLAUDE.md</code> has one setting, a line like{" "}
        <code>Switches version-first mode: ask</code>. It decides what Claude does when it builds a new section or page
        layout without being asked for versions:
      </p>
      <ul>
        <li>
          <b>Off</b>: builds one version, unless you ask for several.
        </li>
        <li>
          <b>Ask</b> (the default): asks “want 3 versions?” once per new section or layout, and builds versions only if
          you say yes.
        </li>
        <li>
          <b>Always</b>: builds 2 or 3 versions automatically.
        </li>
      </ul>
      <p>
        In every mode, small edits, fixes and copy changes stay one version. Versions cost more tokens to build, which
        is why Ask is the default. Change it with <code>npx switches init --mode off</code> (or <code>always</code>,{" "}
        <code>ask</code>), or by editing the line. Details are in the <Link href="/docs/api#cli">API</Link>.
      </p>
      <Pager current="/docs/claude-code" />
    </>
  );
}
