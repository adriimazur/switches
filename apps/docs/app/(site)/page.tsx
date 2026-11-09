import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Link from "next/link";
import { withBase } from "../base";
import { DESCRIPTION, INSTALL, LICENSE, PRODUCT_NAME, TAGLINE } from "../site";
import { Code } from "./components/Code";
import { ClickHint } from "./components/ClickHint";
import { CopyButton } from "./components/CopyButton";
import { Illustration } from "./components/Illustration";
import { ScrollLink, ScrollOnArrival } from "./components/ScrollLink";
import { TryDemo } from "./components/TryDemo";
import { SAMPLE_PICKS } from "./sample";

// The handwriting of the "click here" hint (SIL Open Font License 1.1), fetched
// by next/font at build time and served from this site like Inter.
const hand = Caveat({ subsets: ["latin"], weight: "500", variable: "--s-font-hand", display: "swap" });

export const metadata: Metadata = {
  title: `${PRODUCT_NAME}: let your client pick the version on the real site`,
  description: `${PRODUCT_NAME} is ${DESCRIPTION}`,
};

const steps = [
  { lead: "AI makes the versions.", text: "Ask Claude Code for three versions of a section; all of them go into the page." },
  { lead: "Open the shared link.", text: "You, or your client on their own, open the preview link." },
  { lead: "Flip through them", text: "in the panel behind the round button at the bottom left." },
  {
    lead: "Pick one per section",
    text: "and add a note if you like: “the split one, but with a bigger headline.”",
  },
  { lead: "Press Copy my picks.", text: "The picks become plain text for an email or chat." },
  { lead: "Paste it into Claude Code.", text: "It applies the picks." },
];

const jobs = [
  {
    lead: "Make versions.",
    text: (
      <>
        “Make 3 versions of the hero.” Claude wraps each in a <code>&lt;Variant&gt;</code>, keeps an existing design as
        the default and names versions after the idea, never A, B, C.
      </>
    ),
  },
  {
    lead: "Apply picks.",
    text: "Paste the copied text as it is. Claude keeps each picked version, deletes the others with the code only they used and applies the notes.",
  },
  {
    lead: "Finish.",
    text: "“Finish Switches.” Before launch, Claude removes the panel and the package and leaves a normal site.",
  },
];

const differences = [
  {
    name: "Storybook",
    text: `shows components on their own; ${PRODUCT_NAME} works in place, on the real page, with the real content around each version.`,
  },
  {
    name: "Feature flags",
    text: `need a backend and are for shipping features to users; ${PRODUCT_NAME} has no backend, is for design review and comes out before launch.`,
  },
  {
    name: "Agentation",
    text: `is for feedback on a page (“fix this”); ${PRODUCT_NAME} is for choosing between versions (“pick one of these”).`,
  },
];

export default function Overview() {
  return (
    <>
      <div className="s-topline">
        <p className="s-stat">
          Open source <span aria-hidden>·</span> {LICENSE}
        </p>
        <p className="s-install">
          <code>{INSTALL}</code>
          <CopyButton text={INSTALL} variant="icon" label="Copy install command" />
        </p>
      </div>

      <h1 className="s-lead">{TAGLINE}</h1>
      <p className="s-intro">
        {PRODUCT_NAME} is {DESCRIPTION}
      </p>

      <Illustration />
      <ClickHint fontClass={hand.variable} />

      <h2 id="how">How you use it</h2>
      <ol className="s-steps">
        {steps.map((s) => (
          <li key={s.lead}>
            <b>{s.lead}</b> {s.text}
          </li>
        ))}
      </ol>
      <p className="s-callout">
        Claude Code keeps the picked version of each section and deletes the rest, along with code and files only they
        used, and applies each note as a small tweak. It does not ask which version to keep; it asks only if a name,
        option or note looks wrong or unsafe. If a section or version can’t be found, it says so. Then it runs the build and reports what it kept, deleted and changed.
      </p>

      <h2 id="claude">How Claude uses it</h2>
      <p>
        <code>npx switches init</code> installs a Claude Code skill with three jobs. You ask in plain words:
      </p>
      <ul className="s-leads">
        {jobs.map((j) => (
          <li key={j.lead}>
            <b>{j.lead}</b> {j.text}
          </li>
        ))}
      </ul>
      <p>
        “Copy my picks” gives plain text that reads fine in an email and works as a prompt. Each line names the
        section, the version picked, the page it is on and the note, if there is one. The link opens the site with the
        same versions showing:
      </p>
      <Code label="Clipboard" wrap>
        {SAMPLE_PICKS}
      </Code>
      <p>
        No account and no server: the picks travel by copy and paste, and in the link itself. More in{" "}
        <Link href="/docs/claude-code">Claude Code</Link>.
      </p>

      <ScrollOnArrival />
      <h2 id="try">Try it</h2>
      <p>
        This sample page has three versions. Open the round button at the bottom left of your screen and pick one.
      </p>
      <TryDemo />
      <p className="s-note">
        Picks travel in the link too. Open this page with{" "}
        {/* Plain <a>: a full page load, so the pick applies before first paint. */}
        <ScrollLink href={withBase("/?switches=layout:photo")} to="try">Photo split</ScrollLink> or{" "}
        <ScrollLink href={withBase("/?switches=layout:classes")} to="try">Class list</ScrollLink> already
        picked, or open the <a href={withBase("/demo")}>sample site</a>.
      </p>

      <h2 id="install">Install</h2>
      <Code label="Terminal" copy>
        {INSTALL}
      </Code>
      <p>
        This adds the package, plus a Claude Code skill and a short block in <code>CLAUDE.md</code>. Then put{" "}
        <code>&lt;Switches /&gt;</code> first inside <code>&lt;body&gt;</code> (Claude Code adds it if it is missing),
        ask for versions and send the preview link to whoever is choosing. Step by step in{" "}
        <Link href="/docs">Getting started</Link>.{" "}
        Run <code>npx switches</code> only after installing <code>switches-react</code>; the bare name{" "}
        <code>switches</code> on npm is an unrelated package.
      </p>
      <p className="s-callout">
        <b>Remove it before launch.</b> Tell Claude Code “Finish Switches”: it removes the panel, keeps the default
        version of any section still undecided, deletes the Claude Code setup and uninstalls the package. Until then,
        the production server or build output prints a one-time reminder while <code>&lt;Switches /&gt;</code> renders
        and the flag isn’t <code>off</code>.
      </p>

      <h2 id="differs">How it differs</h2>
      <ul className="s-leads">
        {differences.map((d) => (
          <li key={d.name}>
            <b>{d.name}</b> {d.text}
          </li>
        ))}
      </ul>
    </>
  );
}
