'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { Bar, Phone, Segmented, Stage, Toggle, Window, type Act } from './kit'
import { FullMotionContext, StillContext } from './kit/reduced-motion'
import { useCalmPicked, useFullPicked } from '../sitePicks'
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

function Page({ s }: { s: S }) {
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
          </div>
        </div>
        <span className="so-copy">
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
              height={380}
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
