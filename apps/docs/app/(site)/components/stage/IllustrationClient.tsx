'use client'
import { useEffect, useState } from 'react'
import SwitchesOverview from './SwitchesRound'
import { useCalmPicked, useFullPicked } from '../sitePicks'

// The Overview illustration with its play / pause button. The picture is
// clickable like the real panel; pressing it (or the button) stops the loop,
// and the button starts it again. Hidden from assistive tech like the
// picture itself (it is a decoration); the button is outside it.
export function IllustrationClient({ label }: { label: string }) {
  const [paused, setPaused] = useState(false)
  const calm = useCalmPicked()
  const full = useFullPicked()
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const still = calm || (reduced && !full)
  return (
    <>
      <figure className="il" role="img" aria-label={label}>
        <div aria-hidden>
          <SwitchesOverview paused={paused} onPause={() => setPaused(true)} />
        </div>
      </figure>
      {!still && (
        <div className="il-controls">
          <button
            type="button"
            className="il-play"
            aria-label={paused ? 'Play the animation' : 'Pause the animation'}
            aria-pressed={paused}
            onClick={() => setPaused((p) => !p)}
          >
            <svg viewBox="0 0 16 16" aria-hidden focusable="false">
              {paused ? <path d="M5 3.2v9.6L12.6 8z" /> : <path d="M4.5 3h2.6v10H4.5zM8.9 3h2.6v10H8.9z" />}
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
