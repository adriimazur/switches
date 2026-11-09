import type { Metadata } from "next";
import { PRODUCT_NAME } from "../../../site";
import Link from "next/link";
import { Pager } from "../Pager";

export const metadata: Metadata = { title: `FAQ · ${PRODUCT_NAME} docs` };

export default function Faq() {
  return (
    <>
      <h1>FAQ</h1>

      <h2 id="launch">Does the panel show on my deployed site?</h2>
      <p>
        Yes, on purpose. Switches is built to run on deployed previews (a Vercel preview, a staging address) so your
        client can open the link and pick without any setup. That is the point of it.
      </p>
      <p className="s-callout">
        <b>It must be removed before launch.</b> When the design is settled, ask Claude Code to “finish Switches”.
        It removes the panel and the wrappers, keeps the default of anything undecided and uninstalls the package.
        Until you do, the production server or build output prints a one-time reminder while <code>&lt;Switches /&gt;</code> renders and the flag isn’t <code>off</code>. Details in{" "}
        <Link href="/docs/claude-code#finish">Claude Code</Link>.
      </p>

      <h2 id="storybook">How is it different from Storybook?</h2>
      <p>
        Storybook shows components on their own, outside the site. Switches works in place: the versions sit in the real
        page, with the real content, navigation and spacing around them. The person choosing sees exactly what will
        ship.
      </p>

      <h2 id="flags">Isn’t this just feature flags?</h2>
      <p>
        Feature flags need a backend and are for shipping: rolling features out to real users. Switches has no backend
        and is for design review. The picks end up as code changes, and Switches itself comes out before launch.
      </p>

      <h2 id="agentation">How is it different from Agentation?</h2>
      <p>
        Agentation is for feedback (“fix this”); Switches is for choosing (“pick one of these”). They do different jobs.
      </p>

      <h2 id="backend">Does it need a backend, a database or an account?</h2>
      <p>
        No. Picks are kept in the page link and in the browser, and they reach you by copy and paste. Nothing is sent
        anywhere.
      </p>

      <h2 id="versions">Which React and Next.js versions does it support?</h2>
      <p>
        React 18 and 19, Next.js with the App Router or the Pages Router, and plain React apps. What has been tested:
        React 19 with the Next.js 15 App Router (this site and its end-to-end tests); React 18.3 with the Next.js 14
        Pages Router (production build and dev server: every version in the HTML, the pick script before the content,
        picks and links work, no hydration warnings); and React 18.3 in a Vite 5 production build (the panel, picks
        and links work). Other combinations are expected to work but have not been tested. Two differences in plain
        React apps: without server
        rendering, a page opened with a pick may briefly show the default version first; and the{" "}
        <code>NEXT_PUBLIC_SWITCHES=off</code> flag only works if your bundler replaces{" "}
        <code>process.env.NEXT_PUBLIC_SWITCHES</code> (in Vite, with a <code>define</code> entry). Otherwise Switches is
        simply on.
      </p>

      <h2 id="csp">Does it work with a strict Content Security Policy?</h2>
      <p>
        Not fully with a nonce- or hash-only policy. Switches renders an inline pick script and a small inline{" "}
        <code>&lt;style&gt;</code> per <code>Variant</code>, and such a policy blocks them: picks apply late, and
        without the styles every version of a section may show at once. The preview your client reviews needs{" "}
        <code>style-src &apos;unsafe-inline&apos;</code> or equivalent (and, for picks before first paint, a policy
        that lets the inline script run). There is no nonce prop in this version.
      </p>

      <h2 id="defaults">What if the client likes the defaults?</h2>
      <p>
        Then they just say so. Nothing is copied until they pick something: “Copy my picks” gives “No picks yet.”
      </p>

      <h2 id="hidden">With NEXT_PUBLIC_SWITCHES=off, what happens to the other versions?</h2>
      <p>
        They are still in the page’s HTML, only hidden; every section shows its default and there is no panel. Anyone
        reading the page source could still see them. The flag is an emergency switch, not a cleanup: to remove the
        other versions from your code, finish Switches.
      </p>

      <h2 id="browsers">Which browsers does it work in?</h2>
      <p>
        Versions are hidden with plain CSS. The rules use <code>:is()</code> and <code>:not()</code> with selector
        lists, which need Chrome or Edge 88+, Firefox 84+ or Safari 14+. In older browsers every version of every
        section shows at once.
      </p>
      <p>
        One case also needs <code>:has()</code>: a <code>default</code> version that is not the first one in its
        section. In browsers without <code>:has()</code> (Chrome and Edge before 105, Safari before 15.4, Firefox
        before 121), such a section shows both its first version and its default until a version of that section is
        picked. Picks, links and sections whose default is the first version are not affected. If you need those
        browsers, put the default version first.
      </p>

      <h2 id="clients">Does my client need to install anything?</h2>
      <p>
        No. They open the link you send, press the round button at the bottom left and pick. “Copy my picks” gives
        them text to send back to you.
      </p>

      <h2 id="seo">Will search engines or visitors see the hidden versions?</h2>
      <p>
        All versions are in the HTML while Switches is installed. That is fine for a preview link and another reason to
        finish before launch.
      </p>
      <Pager current="/docs/faq" />
    </>
  );
}
