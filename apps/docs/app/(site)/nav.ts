import { GITHUB_URL } from "../site";

// The site's pages, in reading order: the sidebar groups them, and the pager
// at the foot of each docs page walks through them. A plain module so both
// the client sidebar and server pages can import it.
export const PAGES = [
  { href: "/", title: "Overview" },
  { href: "/docs", title: "Getting started" },
  { href: "/docs/features", title: "Features" },
  { href: "/docs/api", title: "API" },
  { href: "/docs/claude-code", title: "Claude Code" },
  { href: "/docs/faq", title: "FAQ" },
] as const;

export type NavItem = { href: string; title: string; external?: boolean };
export type NavGroup = { label?: string; items: NavItem[] };

const page = (href: (typeof PAGES)[number]["href"]): NavItem => PAGES.find((p) => p.href === href)!;

export const NAV: NavGroup[] = [
  { items: [page("/"), page("/docs"), page("/docs/features")] },
  { label: "Reference", items: [page("/docs/api"), page("/docs/claude-code")] },
  {
    label: "Resources",
    items: [
      page("/docs/faq"),
      // The sample site (/demo) is hidden for now: it still works at its address, but nothing links to it.
      ...(GITHUB_URL ? [{ href: GITHUB_URL, title: "GitHub", external: true }] : []),
    ],
  },
];
