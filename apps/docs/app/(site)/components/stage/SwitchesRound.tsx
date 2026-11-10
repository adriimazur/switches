'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { Bar, Phone, Segmented, Stage, Toggle, Window, type Act } from './kit'
import { FullMotionContext, StillContext } from './kit/reduced-motion'
import { useCalmPicked, useFullPicked, useSitePick } from '../sitePicks'
import './switches-round.css'

// The Switches Overview illustration, started from the panel-annotation gold:
// the product (a preview site) behind, the tool (the Switches sheet) in front,
// and one shared change that ties a setting to what it changed. Here the tool
// is anchored where the real one sits, bottom left over the page's margin,
// with its round button open under it.
//
// Beats (11.6s loop): the pointer turns the Hero switch off and the hero
// becomes the centred version; picks Tiers and the pricing becomes three
// tiers; turns Hero back on (split); picks One plan (a single plan). The loop
// ends on the frame it began with, every change caused by a click.
//
// Real strings: the panel's own words (Switches, Hero, Pricing, the three
// pricing versions, Copy my picks) and the preview address. The page is
// filler: what changes is its shape, not its words.

type S = { hero: 0 | 1; plan: 0 | 1 }

// Opening frame = poster: Hero on (split), One plan picked. The poster tells
// the story alone: a switch on, a version picked, the page showing both.
const initial: S = { hero: 1, plan: 1 }

const PLANS = ['Tiers', 'One plan', 'Compare']

async function script(a: Act<S>) {
  await a.wait(900)
  a.mark('hero-off')
  await a.click({ at: 'switch', x: 0.7, y: 0.62 })
  await a.set({ hero: 0 })
  await a.wait(1700)
  a.mark('tiers')
  await a.click({ at: 'seg-0', x: 0.86, y: 0.72 })
  await a.set({ plan: 0 })
  await a.wait(1900)
  a.mark('hero-on')
  await a.click({ at: 'switch', x: 0.7, y: 0.62 })
  await a.set({ hero: 1 })
  await a.wait(1700)
  a.mark('one-plan')
  await a.click({ at: 'seg-1', x: 0.86, y: 0.72 })
  await a.set({ plan: 1 })
  await a.wait(1500)
  a.mark('rest')
  await a.move({ at: 'rest' })
}

function HeroCentred() {
  return (
    <div className="so-v so-hero-a">
      <Bar w={46} h={6} r={3} tone={2} />
      <Bar w={150} h={11} r={3} tone={4} />
      <Bar w={108} h={11} r={3} tone={4} />
      <Bar w={132} h={5} r={2.5} tone={2} />
      <span className="so-cta" />
    </div>
  )
}

function HeroSplit() {
  return (
    <div className="so-v so-hero-b">
      <span className="so-pic" />
      <div className="so-split-text">
        <Bar w={96} h={11} r={3} tone={4} />
        <Bar w={70} h={11} r={3} tone={4} />
        <Bar w={88} h={5} r={2.5} tone={2} />
        <span className="so-cta" />
      </div>
    </div>
  )
}

function PlanCard({ featured, wide }: { featured?: boolean; wide?: boolean }) {
  return (
    <div className="so-card" data-featured={featured || undefined}>
      <Bar w={wide ? 40 : 26} h={5} r={2.5} tone={2} />
      <Bar w={wide ? 56 : 34} h={10} r={3} tone={4} />
      <Bar w="100%" h={4} r={2} tone={2} className="so-card-line" />
      <Bar w="72%" h={4} r={2} tone={2} className="so-card-line" />
      {wide && <span className="so-cta so-card-cta" />}
    </div>
  )
}

// The compact design is the same round on a phone, which is where clients
// often open the link: a touch dot instead of the macOS arrow.
function usePhoneColumn() {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const update = () => setPhone(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return phone
}

// The panel's own preset icons (Mono Icons, MIT; see THIRD_PARTY_NOTICES.md).
const ICON_PATHS = {
  sun: 'M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm7.071 2.929a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0zm-14.142 0a1 1 0 0 1 1.414 0l.707.707A1 1 0 0 1 5.636 7.05l-.707-.707a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-6 4a6 6 0 1 1 12 0 6 6 0 0 1-12 0zm-4 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm17 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zM5.636 16.95a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707zm11.314 1.414a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707zM12 19a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1z',
  moon: 'M9.36 3.293a1 1 0 0 1 .187 1.157A7.45 7.45 0 0 0 19.55 14.453a1 1 0 0 1 1.343 1.343 9.45 9.45 0 1 1-12.69-12.69 1 1 0 0 1 1.158.187zM6.823 6.67A7.45 7.45 0 0 0 17.33 17.179 9.45 9.45 0 0 1 6.821 6.67z',
  system: 'M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7v2h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2H4a2 2 0 0 1-2-2V5zm18 11V5H4v11h16z',
  copy: 'M2 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-4H4a2 2 0 0 1-2-2V4zm8 12v4h10V10h-4v4a2 2 0 0 1-2 2h-4zm4-2V4H4v10h10z',
} as const

function Ico({ name }: { name: keyof typeof ICON_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" className="so-ico" fill="currentColor" aria-hidden>
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}

const MODES = ['light', 'dark', 'system']
const ACCENTS = ['black', 'blue', 'orange']

function Page({ s }: { s: S }) {
  // The two site-wide sections follow what the visitor has picked (the sheet
  // here is a picture of the real panel, so it shows the real picks).
  const mode = Math.max(0, MODES.indexOf(useSitePick('mode') ?? 'system'))
  const accent = Math.max(0, ACCENTS.indexOf(useSitePick('accent') ?? 'black'))
  return (
    <div className="so-page">
      <div className="so-nav">
        <Bar w={40} h={8} r={3} tone={4} />
        <span className="so-links">
          <Bar w={22} h={5} r={2.5} tone={2} />
          <Bar w={22} h={5} r={2.5} tone={2} />
          <Bar w={22} h={5} r={2.5} tone={2} />
        </span>
      </div>

      {/* The two sections with versions; each keeps both mounted and crossfades. */}
      <div className="so-hero" data-version={s.hero}>
        <HeroCentred />
        <HeroSplit />
      </div>

      <div className="so-pricing" data-version={s.plan}>
        <Bar w={64} h={8} r={3} tone={4} className="so-pricing-title" />
        <div className="so-v so-plan-a">
          <PlanCard />
          <PlanCard featured />
          <PlanCard />
        </div>
        <div className="so-v so-plan-b">
          <PlanCard featured wide />
        </div>
      </div>

      <span className="so-rest" data-target="rest" />

      {/* The Switches sheet, drawn with the real panel's measures. */}
      <div className="so-sheet">
        <span className="so-title">Switches</span>
        <div className="so-groups">
          <div className="so-group">
            <div className="so-item so-row">
              <span className="so-label">Hero</span>
              <Toggle on={s.hero === 1} className="so-switch" data-target="switch" data-cursor="pointer" />
            </div>
          </div>
          <div className="so-group">
            <div className="so-item">
              <span className="so-label">Pricing</span>
              <Segmented items={PLANS} value={s.plan} targets={['seg-0', 'seg-1', 'seg-2']} cursor="pointer" className="so-seg" />
            </div>
            <div className="so-item so-more">
              <span className="so-label">Mode</span>
              <Segmented
                items={[
                  <span key="l" className="so-opt"><Ico name="sun" />Light</span>,
                  <span key="d" className="so-opt"><Ico name="moon" />Dark</span>,
                  <span key="s" className="so-opt"><Ico name="system" />System</span>,
                ]}
                value={mode}
                className="so-seg"
              />
            </div>
            <div className="so-item so-more">
              <span className="so-label">Accent</span>
              <Segmented
                items={ACCENTS.map((a) => (
                  <span key={a} className="so-opt"><i className="so-dot" data-accent={a} />{a[0]!.toUpperCase() + a.slice(1)}</span>
                ))}
                value={accent}
                className="so-seg"
              />
            </div>
          </div>
        </div>
        <span className="so-copy">
          <Ico name="copy" />
          <span>Copy my picks</span>
        </span>
      </div>

      {/* The round button, open. */}
      <span className="so-button">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M3 6h8M15 6h2M3 14h2M9 14h8" />
          <circle cx="13" cy="6" r="2" />
          <circle cx="7" cy="14" r="2" />
        </svg>
      </span>
    </div>
  )
}

// The phone design as a still, for the first paint on a phone column: the
// Stage only learns its container's width once React runs, so before that
// (or with JavaScript off) it would draw the wide design cropped. This still
// draws the phone poster at its own design size; the CSS shows it below the
// compact breakpoint until the live stage is ready.
function SwitchesStill() {
  return (
    <Stage width={358} height={560} initial={initial} poster={initial} className="so so-still">
      {(s): ReactNode => (
        <Phone width={326} className="so-phone">
          <Page s={s} />
        </Phone>
      )}
    </Stage>
  )
}

export default function SwitchesOverview({ className }: { className?: string }) {
  const phone = usePhoneColumn()
  // The site's Animation pick, live, without a reload. Calm: the same still
  // as reduced motion (the kit's StillContext). Full: play even when the OS
  // asks for reduced motion (an explicit choice in the panel).
  const calm = useCalmPicked()
  const full = useFullPicked()
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return (
    <div className="so-round" data-ready={ready || undefined}>
      <div className="so-live">
        <StillContext.Provider value={calm}>
          <FullMotionContext.Provider value={full}>
            <Stage
              width={560}
              height={542}
              compact={{ below: 520, width: 358, height: 560 }}
              initial={initial}
              poster={initial}
              script={script}
              cursor={{ at: 'rest', style: phone ? 'touch' : 'real', idle: false }}
              className={`so${className ? ` ${className}` : ''}`}
            >
              {(s, _rect, layout): ReactNode =>
                layout === 'compact' ? (
                  <Phone width={326} className="so-phone">
                    <Page s={s} />
                  </Phone>
                ) : (
                  <Window url="preview.yoursite.com" urlShape="pill" className="so-win">
                    <Page s={s} />
                  </Window>
                )
              }
            </Stage>
          </FullMotionContext.Provider>
        </StillContext.Provider>
      </div>
      {!ready && (
        <div className="so-first">
          <SwitchesStill />
        </div>
      )}
    </div>
  )
}
