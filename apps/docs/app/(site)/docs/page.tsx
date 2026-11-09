import type { Metadata } from "next";
import { PRODUCT_NAME } from "../../site";
import Link from "next/link";
import { Code } from "../components/Code";
import { Pager } from "./Pager";

export const metadata: Metadata = { title: `Getting started · ${PRODUCT_NAME} docs` };

export default function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="s-intro">
        Switches keeps several versions of a page section on your real site. A round button at the bottom left opens a
        panel where anyone can flip between them, pick one per section and copy the picks as text for Claude Code.
        Setup is three steps.
      </p>

      <h2>1. Install</h2>
      <p>In your project folder, run:</p>
      <Code label="Terminal" copy>
        pnpm add switches-react && npx switches init
      </Code>
      <p>
        The first command adds the package (with npm: <code>npm i switches-react</code>; with yarn:{" "}
        <code>yarn add switches-react</code>). The second sets up Claude Code: it writes a skill to{" "}
        <code>.claude/skills/switches/SKILL.md</code> and adds a short Switches block to <code>CLAUDE.md</code>.{" "}
        Run <code>npx switches</code> only after installing <code>switches-react</code>; the bare name{" "}
        <code>switches</code> on npm is an unrelated package.
      </p>
      <p>
        <code>init</code> takes an optional version-first mode, which decides whether Claude Code offers versions on
        its own when it builds something new:
      </p>
      <Code label="Terminal">npx switches init [--mode off|ask|always]</Code>
      <ul>
        <li>
          <b>off</b>: one version, unless you ask for more.
        </li>
        <li>
          <b>ask</b> (the default): before building a new section or page layout, Claude asks “want 3 versions?”
        </li>
        <li>
          <b>always</b>: Claude builds 2 or 3 versions of each new section or layout without asking.
        </li>
      </ul>
      <p>Small edits, fixes and copy changes always stay one version. Run <code>init</code> again to change the mode.</p>

      <h2>2. Add the panel</h2>
      <p>
        Render <code>&lt;Switches /&gt;</code> once, as the very first thing inside <code>&lt;body&gt;</code>. It
        includes a tiny script that applies saved picks before the page first paints, so it has to come before your
        content.
      </p>
      <h3>Next.js App Router</h3>
      <p>
        In <code>app/layout.tsx</code>. Also add <code>suppressHydrationWarning</code> to <code>&lt;html&gt;</code>:
        the script sets a <code>data-switches-picks</code> attribute there before React loads, which React would
        otherwise report as a hydration mismatch in development.
      </p>
      <Code label="app/layout.tsx">{`import { Switches } from "switches-react";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Switches />
        {children}
      </body>
    </html>
  );
}`}</Code>
      <h3>Next.js Pages Router</h3>
      <p>
        In <code>pages/_app.tsx</code>, as the first element, before the page. Not in <code>_document</code>: that
        file only renders on the server, so the panel would never start. No <code>suppressHydrationWarning</code> is
        needed here. Tested with Next.js 14 and React 18.3.
      </p>
      <Code label="pages/_app.tsx">{`import type { AppProps } from "next/app";
import { Switches } from "switches-react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Switches />
      <Component {...pageProps} />
    </>
  );
}`}</Code>
      <h3>Plain React (Vite and similar)</h3>
      <p>
        As the first element of your root component. Without server-rendered HTML, picks apply when React renders, so
        a page opened with a pick can briefly show the default version first. The{" "}
        <code>NEXT_PUBLIC_SWITCHES=off</code> flag works only if your bundler replaces{" "}
        <code>process.env.NEXT_PUBLIC_SWITCHES</code>; otherwise Switches is simply on.
      </p>

      <h2>3. Wrap the versions</h2>
      <p>
        Each version of a section goes in a <code>&lt;Variant&gt;</code> with the same <code>name</code> and its own{" "}
        <code>option</code>. Put them next to each other. Usually you don’t write this by hand: ask Claude Code for
        versions and it writes this for you.
      </p>
      <Code label="app/page.tsx">{`import { Variant } from "switches-react";

<Variant name="hero" option="original" default>
  <HeroOriginal />
</Variant>
<Variant name="hero" option="phone">
  <HeroPhone />
</Variant>
<Variant name="hero" option="split">
  <HeroSplit />
</Variant>`}</Code>
      <p>
        Open the page, press the round button at the bottom left, and the Hero section is there with three choices.
        Deploy it as usual and send the preview link to whoever is choosing.
      </p>
      <p>
        Next: what the panel can do, in <Link href="/docs/features">Features</Link>. Before you launch, read{" "}
        <Link href="/docs/claude-code#finish">how to finish</Link>.
      </p>
      <Pager current="/docs" />
    </>
  );
}
