import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import {
  AUTHOR_NAME,
  AUTHOR_URL,
  GITHUB_URL,
  LICENSE,
  LICENSE_URL,
  LINKEDIN_URL,
  NPM_URL,
  PRODUCT_NAME,
  VERSION,
} from "../site";
import { Sidebar } from "./components/Sidebar";
import { SiteSwitches } from "./components/SiteSwitches";
import { Wordmark } from "./components/Wordmark";
import "./site.css";

// The public site: Overview (/) and /docs/*, in one shell (sidebar + one
// narrow column). Everything is scoped under .site so the /demo sample site
// keeps its own look. Fonts are fetched by next/font at build time and served
// from this site (Inter and JetBrains Mono, both SIL Open Font License 1.1).

const sans = Inter({
  subsets: ["latin"],
  variable: "--s-font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--s-font-mono",
  display: "swap",
});

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M8 .2a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 .2Z"
      />
    </svg>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const footerLinks = [
    { href: GITHUB_URL, label: "GitHub" },
    { href: NPM_URL, label: "npm" },
    { href: AUTHOR_URL, label: "mazur.design" },
    { href: LINKEDIN_URL, label: "LinkedIn" },
  ].filter((l) => l.href);

  const sideFoot = (
    <>
      <span className="s-version">v{VERSION}</span>
      {GITHUB_URL && (
        <a href={GITHUB_URL} className="s-gh" aria-label={`${PRODUCT_NAME} on GitHub`}>
          <GitHubIcon />
        </a>
      )}
    </>
  );

  return (
    <div className={`site ${sans.variable} ${mono.variable}`}>
      <a className="s-skip" href="#main">
        Skip to content
      </a>
      <div className="s-shell">
        <Sidebar brand={<Wordmark />} foot={sideFoot} />
        <div className="s-col">
          <main id="main" className="s-prose" tabIndex={-1}>
            {children}
          </main>
          <footer className="s-footer">
            <p>
              {PRODUCT_NAME} is free to use, and its source is available under the{" "}
              <a href={LICENSE_URL}>{LICENSE}</a> license. Made by{" "}
              <a href={AUTHOR_URL}>{AUTHOR_NAME}</a>.
            </p>
            <ul aria-label="Elsewhere">
              {footerLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </footer>
        </div>
      </div>
      {/* Mode, Animation and Accent in the Switches panel, on every page of the shell */}
      <SiteSwitches />
    </div>
  );
}
