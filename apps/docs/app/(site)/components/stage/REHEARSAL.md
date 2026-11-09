# Rehearsal: Switches Overview illustration (SwitchesRound.tsx)

Made with the Stageshow skill (its kit is vendored in `./kit`, MIT, see `./kit/LICENSE`).

Gold: `panel-annotation` (a settings panel over the product it changes; one shared change ties the setting to what it changed). Kept: the product behind and the tool in front, two jobs at two weights, the shared change as the explanation, the Stage/Act structure, a poster that is the payoff. Changed: the panel is anchored where the real Switches sheet sits (bottom left over the page's margin, round button open under it) instead of straddling the window's edge; no leader line (the section changing behind the sheet already says what changed); the look maps the kit's tokens to the docs site's neutrals and draws the sheet with the real panel's measures (268px sheet, 18px radius, 44x26 switch with a 22px knob, segmented control, #ff4b14 accent, real dark palette); a compact design is the same round on a phone (kit `Phone`), because a 358px desktop window would be taller than wide.

Beats (about 11.6s loop, then the next loop starts): opens on the poster (Hero on, split hero; One plan picked) · click the Hero switch off, the hero crossfades to the centred version · click Tiers, the pricing becomes three tiers · click Hero on, the split hero returns · click One plan, a single plan returns · the pointer goes back to rest. The loop ends on the frame it began with; every change has a click as its cause.

Real strings: Switches, Hero, Pricing, Tiers, One plan, Compare, Copy my picks, preview.yoursite.com. The page is filler bars: what changes is its shape.

Captured with the Stageshow skill's own filming tool (part of the skill, which is installed locally and not in this repo; only the kit is vendored here), in headless Chrome: the wide loop at 1280, the phone loop at 390, every beat as a states sheet, the dark look, the reduced-motion poster and the loop seam at 60ms. Also on the site itself: a production build at 1280/768/375, light and dark, the reduced-motion poster and animation frames.

Gate: every run above ended `rehearsal passed`. Captures were marked inconclusive only for sampling gaps (headless capture overhead), not for findings.

Film lines and what was done:
- `loose list` on the sheet (title, groups, Copy measured as rows with the taller Pricing group skipped) → the two groups are wrapped in one block (`so-groups`); nothing hidden, same render.
- `near aligned` title/label/Copy (box starts 12px apart) → the 12px insets are on the boxes the words start in (title margin, Copy's inner span); same render.
- `uneven padding` on the pricing cards → cards size to their content with a full-width line, no fixed height.
- `framing` (358x576 desktop window "nearly square") → compact became a phone, pinned 16px from the left and bottom, off the top (the crop falls inside the page, below the status bar).
- `framing` (phone 22px past the right edge; corner-bleed gutter) → phone kept whole across at 326px with 16px gutters.
- `small text: "Switches" renders at 9.1px on a phone` (not a gate line) → in the site version the phone's panel title is set at 14.5pt, 11px at the phone's 0.76 scale (labels are 10.7px); a bigger phone would run off the right, which the framing check rejects.
- The phone's long kit shadow was cut by the stage edge into a gray plate on the white page → a short, quiet shadow on `.so-phone`.

Review: no separate fresh-eye reviewer was run (no subagents in this task); the owner's own review of the published page is the fresh eye.

Assumptions: the site's colour scheme comes from `<html>` (it follows `prefers-color-scheme` unless the site's Mode switch forces light or dark; see the top of site.css), so the dark look is `light-dark()` pairs over the light theme's tokens. The Stage's `theme` stays `light`. The site's Animation pick: Calm holds the poster exactly as reduced motion does (the kit's `StillContext`); Full plays the loop even under reduced motion (`FullMotionContext`, the one local change in the kit).

Unresolved / known limits:
- The Stage measures its container after hydration: the server HTML draws the wide design at 1:1 (exact on desktop, where the column is 560px). On a phone column a still of the phone design shows instead until the live stage is ready (CSS below a 552px viewport), so neither the first paint nor a page with JavaScript off shows the wide design cropped.
- During each crossfade both versions of a section are briefly visible together (a crossfade by design, 0.45s).

Not checked: Safari and Firefox (Chrome only); touch devices (the phone design uses the kit's touch dot, seen only in headless Chrome at 390); frame-rate on a real low-end phone.
