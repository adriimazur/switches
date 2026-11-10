# Switches

Switches lets you put several versions of a page section into the real site, so a client or teammate can flip between them in a floating panel, pick one, and send you back a block of text that Claude Code can apply.

It is for the moment when "which hero is better?" is easier to answer on the actual page than in screenshots.

## The loop

1. You (or Claude Code) build 2-3 versions of a section as sibling `<Variant>` elements.
2. You deploy. A small panel appears on the page.
3. The client flips between the versions and picks one per section, optionally with a note.
4. The client copies the picks as text and sends it to you.
5. You paste it into Claude Code, which keeps the chosen version, deletes the rest, and applies the notes.

There is no server, account or database. Picks live in the browser and in the page URL.

## Install

```sh
pnpm add switches-react && npx switches init
```

`npm i switches-react` and `yarn add switches-react` work too. `npx switches init` adds a Claude Code skill (`.claude/skills/switches`) and a short block in `CLAUDE.md`. `npx switches uninit` removes both. Run `npx switches` only after installing `switches-react`; the bare name `switches` on npm is an unrelated package.

## Use it (Next.js App Router)

```tsx
// app/layout.tsx
import { Switches } from "switches-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Switches />
        {children}
      </body>
    </html>
  );
}
```

`<Switches />` goes once, as the first thing in `<body>`: it runs a tiny script that applies saved picks before first paint. `suppressHydrationWarning` on `<html>` is needed because that script sets one attribute there before React hydrates.

```tsx
// app/page.tsx
import { Variant } from "switches-react";

export default function Page() {
  return (
    <>
      <Variant name="hero" option="original" default>
        <Hero />
      </Variant>
      <Variant name="hero" option="split">
        <HeroSplit />
      </Variant>
      <Variant name="hero" option="phone">
        <HeroPhone />
      </Variant>
    </>
  );
}
```

All versions of one section must be adjacent siblings. Each `name` is a section, each `option` a version of it; `default` marks the version shown first (otherwise the first one is).

## What the client sends you

The panel's copy button produces text like this:

```
Switches picks: hero: phone · pricing: simple
hero: phone (/)
pricing: simple (/pricing) — note: make annual billing the default
Link: https://example.com/?switches=hero%3Aphone%2Cpricing%3Asimple
Apply these picks: keep the chosen version of each section and delete the others.
```

The link reopens the page with those picks selected. If the client is happy with the defaults, they just say so; nothing is copied until they pick something (the button gives "No picks yet.").

## Tested with

React 19 with the Next.js 15 App Router (the docs site and its end-to-end tests), React 18.3 with the Next.js 14 Pages Router (`<Switches />` first in `pages/_app`), and React 18.3 in a Vite 5 production build. Other React 18/19 and Next.js combinations are expected to work but have not been tested. Setup for each is in the docs.

## What Claude Code does

After `npx switches init`, Claude Code knows three jobs:

- **Make versions.** Ask for "3 versions of the hero" and it writes the `<Variant>` siblings, adds `<Switches />` if missing, and tells you the section and option names. The `CLAUDE.md` block has a mode (`off`, `ask`, `always`; change it with `npx switches init --mode <mode>`) that decides whether Claude offers versions when it builds a new section.
- **Apply picks.** Paste the copied text. It keeps the chosen version of each section, deletes the others and the code only they used, and applies the notes.
- **Finish.** Say "finish Switches" and it removes every `<Variant>` (keeping the default or the pick), `<Switches />`, the `suppressHydrationWarning` it added, the dependency, the skill and the `CLAUDE.md` block.

## Remove before launch

> **Switches is a review tool, not something to ship.** While `<Switches />` is in your app, anyone who opens the page sees the panel and can switch versions. Before the real launch, run the finish job (or remove `<Switches />` and the `<Variant>` wrappers by hand and uninstall the package). While Switches is installed, a production build or server run prints a reminder in the build/server log (a server-side `console.warn`, once per process, not in the browser console).
>
> As an emergency switch, set `NEXT_PUBLIC_SWITCHES=off`: the panel disappears and only the default versions render. It is not a substitute for finishing.

## How it compares

- **Storybook** shows components in isolation, in a separate tool. Switches shows alternatives inside the real, deployed page.
- **Feature flags and A/B testing** split real traffic and measure results. Switches has no analytics or traffic split; it collects one person's deliberate choice and note.
- **Agentation** lets you annotate a UI for an AI agent. Switches is about choosing between versions that already exist; the two do different jobs.

## Docs

Full docs and a live demo: https://mazur.design/switches.

## License

Free to use, with the source available, under the [PolyForm Shield 1.0.0](https://polyformproject.org/licenses/shield/1.0.0) license. In short: use it on your own and your clients' sites, read it and change it, but don't use it to build a product that competes with Switches. See [LICENSE](https://github.com/adriimazur/switches/blob/main/LICENSE).
