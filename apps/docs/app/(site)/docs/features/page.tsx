import type { Metadata } from "next";
import { PRODUCT_NAME } from "../../../site";
import Link from "next/link";
import { Code } from "../../components/Code";
import { SAMPLE_PICKS } from "../../sample";
import { Pager } from "../Pager";

export const metadata: Metadata = { title: `Features · ${PRODUCT_NAME} docs` };

export default function Features() {
  return (
    <>
      <h1>Features</h1>
      <p className="s-intro">
        Everything here works on the real site, for anyone with the link. Nobody needs an account or
        anything installed to pick.
      </p>

      <h2 id="flip">Flip versions on the live page</h2>
      <p>
        A round button sits at the bottom left of every page that has versions. It opens a small panel listing each
        section on the current page that has more than one version:
      </p>
      <ul>
        <li>a section with two versions gets a switch (off is the first version in the page, on is the second);</li>
        <li>a section with three or more gets a row of buttons, one per version.</li>
      </ul>
      <p>When you pick a version, the page scrolls to that section if it isn’t on screen.</p>
      <p>
        The panel finds the versions on the page by itself, including sections that appear later, for example after
        moving to another page of the site. Section names are shown in plain words (<code>signup-form</code> becomes
        “Signup form”), and a version can have its own <code>label</code>. Press Esc or click outside the panel to
        close it. It follows the light or dark setting of the device.
      </p>

      <h2 id="links">Picks live in the link</h2>
      <p>
        As you pick, the address bar updates, for example <code>?switches=hero%3Asplit</code>. Copy that address and
        anyone who opens it sees the same versions. Picks are also saved in your browser, so a refresh keeps them; if
        the link and the saved picks disagree, the link wins.
      </p>
      <p>
        On server-rendered sites (Next.js) the picked version is in place before the page first appears. There is no
        flash of the default version.
      </p>

      <h2 id="notes">A note on any pick</h2>
      <p>
        Under each section there is an <b>Add note</b> link. Notes are one line, up to 280 characters, for things like
        “this one, but with a bigger headline”. They go out with the picks.
      </p>

      <h2 id="copy">Copy my picks</h2>
      <p>
        The button at the bottom of the panel copies every pick as plain text, ready to paste into an email, a chat
        message or Claude Code. Picks are site-wide, and each line says which page the pick was made on (unless that address has unusual
        characters). If the
        browser blocks the clipboard, the text appears in a box, selected, to copy by hand.
      </p>
      <Code label="Clipboard" wrap>{SAMPLE_PICKS}</Code>
      <p>
        The format is described in <Link href="/docs/claude-code#apply">Claude Code</Link>.
      </p>

      <h2 id="previews">Works on deployed previews</h2>
      <p>
        Switches is meant to run on the site you share: a Vercel preview, a staging address, any deployed URL. The panel
        shows in production builds on purpose, so a client can open the link and pick on their own. That also means
        you must remove it before launch; see <Link href="/docs/faq#launch">the FAQ</Link>.
      </p>

      <h2 id="no-backend">No backend</h2>
      <p>
        There is no server, database or account. Picks live in the link and in the browser, and they reach you by copy
        and paste.
      </p>

      <h2 id="modes">Version-first modes</h2>
      <p>
        A setting in <code>CLAUDE.md</code> decides whether Claude Code offers versions on its own when it builds a new
        section or page layout:
      </p>
      <ul>
        <li>
          <b>Off</b>: one version, unless you ask for several.
        </li>
        <li>
          <b>Ask</b> (the default): Claude asks “want 3 versions?” before building a new section.
        </li>
        <li>
          <b>Always</b>: Claude builds 2 or 3 versions of new sections without asking.
        </li>
      </ul>
      <p>
        Small edits, fixes and copy changes never get versions. Change the mode with{" "}
        <code>npx switches init --mode always</code> (or <code>off</code>, <code>ask</code>), or edit the line in{" "}
        <code>CLAUDE.md</code> by hand.
      </p>
      <Pager current="/docs/features" />
    </>
  );
}
