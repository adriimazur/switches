import type { Metadata } from "next";
import { PRODUCT_NAME } from "../../../site";
import Link from "next/link";
import { Code } from "../../components/Code";
import { Pager } from "../Pager";

export const metadata: Metadata = { title: `API · ${PRODUCT_NAME} docs` };

const WARNING =
  '[switches] Switches is still installed in this production build. Remove it before launch: ask Claude to "finish" Switches.';

export default function Api() {
  return (
    <>
      <h1>API</h1>
      <p className="s-intro">
        Two components, one environment flag and two commands. Both components are safe in React Server Components; you
        don’t need <code>&quot;use client&quot;</code> in your own files.
      </p>
      <Code>{`import { Switches, Variant } from "switches-react";`}</Code>

      <h2 id="switches">&lt;Switches /&gt;</h2>
      <p>
        The panel. It takes no props. Render it once in the whole app, as the first child of <code>&lt;body&gt;</code>{" "}
        (see <Link href="/docs">Getting started</Link> for each framework). It outputs a small inline script, which applies
        saved and linked picks before first paint, and the panel itself.
      </p>

      <h2 id="variant">&lt;Variant&gt;</h2>
      <p>Marks one version of a section.</p>
      <div className="s-table-wrap" tabIndex={0} role="region" aria-label="Variant props">
        <table className="s-table">
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Type</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>name</code>
              </td>
              <td>string, required</td>
              <td>The section. Every version of one section has the same name. The panel shows it in plain words.</td>
            </tr>
            <tr>
              <td>
                <code>option</code>
              </td>
              <td>string, required</td>
              <td>This version’s name, unique within the section. Picks, links and copied text refer to it.</td>
            </tr>
            <tr>
              <td>
                <code>label</code>
              </td>
              <td>string</td>
              <td>Text for this version in the panel. Without it, the option is shown in plain words.</td>
            </tr>
            <tr>
              <td>
                <code>swatch</code>
              </td>
              <td>string</td>
              <td>
                A colour (<code>#2563eb</code>, <code>rgb(…)</code>, <code>hsl(…)</code> or a name). The panel draws a
                dot of it beside the label. For colour choices.
              </td>
            </tr>
            <tr>
              <td>
                <code>icon</code>
              </td>
              <td>“sun”, “moon” or “system”</td>
              <td>An icon drawn beside the label in the panel. For light, dark and system choices.</td>
            </tr>
            <tr>
              <td>
                <code>default</code>
              </td>
              <td>boolean</td>
              <td>Show this version when nothing is picked. Without it, the first version is the default.</td>
            </tr>
            <tr>
              <td>
                <code>children</code>
              </td>
              <td>ReactNode</td>
              <td>The version itself.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Code label="Example">{`<Variant name="pricing" option="tiers" default>
  <PricingTiers />
</Variant>
<Variant name="pricing" option="simple" label="One plan">
  <PricingSimple />
</Variant>`}</Code>

      <h3 id="siblings">Rule: versions sit next to each other</h3>
      <p>
        All versions of one section must be siblings: under the same parent element, one after another, with nothing
        in between. Every version is in the HTML, and Switches hides the ones not showing with CSS sibling selectors.
        Versions split across different parents all show at once.
      </p>

      <h3 id="names">Rule: unique names</h3>
      <p>
        A section <code>name</code> must be unique across the whole site, because picks are site-wide. Option names
        must be unique within their section; a duplicate is ignored with a console warning. Name versions after the
        idea (<code>phone</code>, <code>split</code>), not <code>a</code> or <code>b</code>: clients see them, and
        letters stop meaning anything once versions are added or removed.
      </p>

      <h3 id="default">Which version shows by default</h3>
      <p>
        With no pick, the version marked <code>default</code> shows; without one, the first version. A pick for a
        version that no longer exists is ignored, and the default shows. Picks for sections that no longer exist are
        forgotten after the next visit. Mark one default per section.
      </p>

      <h3 id="wrapper">What a Variant adds to the page</h3>
      <p>
        Each Variant renders a <code>&lt;div style=&quot;display: contents&quot;&gt;</code> around its children, plus a
        small <code>&lt;style&gt;</code>. Layout is unaffected, but CSS that relies on direct children{" "}
        (<code>&gt;</code>) or on <code>:first-child</code> / <code>:nth-child</code> may need adjusting while the
        versions are in place.
      </p>

      <h2 id="env">NEXT_PUBLIC_SWITCHES=off</h2>
      <p>
        An emergency switch. Set it as an environment variable and rebuild (Next.js reads <code>NEXT_PUBLIC_</code>{" "}
        values at build time; other bundlers need to replace{" "}
        <code>process.env.NEXT_PUBLIC_SWITCHES</code> themselves, for example with Vite’s <code>define</code>, or the
        flag has no effect). Then:
      </p>
      <ul>
        <li>
          <code>&lt;Switches /&gt;</code> renders nothing: no panel, no script;
        </li>
        <li>every section shows its default version, whatever is in the link or the browser;</li>
        <li>
          the other versions are still in the HTML, only hidden. The code, the wrappers and the package all stay.
        </li>
      </ul>
      <p>
        It does not clean anything up. To launch, finish Switches instead (see{" "}
        <Link href="/docs/claude-code#finish">Claude Code</Link>).
      </p>

      <h2 id="warning">Production build warning</h2>
      <p>
        While <code>&lt;Switches /&gt;</code> renders in a production build and the flag isn’t <code>off</code>, the
        server or build output prints this, once per process. In a client-only app (such as Vite) it appears in the
        browser console instead; if the bundler does not define <code>NODE_ENV</code>, nothing is printed.
      </p>
      <Code label="Build log" wrap>{WARNING}</Code>
      <p>
        This is a reminder, not an error: Switches is meant to run on deployed previews. With{" "}
        <code>NEXT_PUBLIC_SWITCHES=off</code> it is not printed.
      </p>

      <h2 id="cli">Commands</h2>
      <Code label="Terminal">{`npx switches init [--mode off|ask|always]
npx switches uninit`}</Code>
      <ul>
        <li>
          <code>init</code> writes the Claude Code skill to <code>.claude/skills/switches/SKILL.md</code> and adds or
          updates the Switches block in <code>CLAUDE.md</code> (creating the file if needed). The mode defaults to{" "}
          <code>ask</code>. Running it again replaces the block and the skill, so it is also how you change the mode.
        </li>
        <li>
          <code>uninit</code> removes the skill folder and the Switches block. If the block was all that{" "}
          <code>CLAUDE.md</code> held, the file is deleted.
        </li>
      </ul>
      <p>
        The block in <code>CLAUDE.md</code> sits between two markers. Only the text between them is ever rewritten, so
        the rest of the file is safe. If there is more than one start or end marker, the commands stop and ask you to
        fix it by hand.
      </p>
      <Code label="CLAUDE.md">{`<!-- switches:start -->
## Switches

Switches version-first mode: ask
…
<!-- switches:end -->`}</Code>
      <Pager current="/docs/api" />
    </>
  );
}
