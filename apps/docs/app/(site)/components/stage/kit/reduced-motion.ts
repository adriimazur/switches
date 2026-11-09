// Vendored from the Stageshow kit (MIT, Copyright (c) 2026 Benji Taylor); see ./LICENSE.
// One local change: FullMotionContext (below), for the Switches site's Animation: Full pick.
import { createContext, useContext, useEffect, useState } from 'react'

// Static stages settle motion parts too, even without an OS preference.
export const StillContext = createContext(false)

// Local change: a host can let a stage play even under prefers-reduced-motion,
// when the viewer explicitly asked for it (the site's Animation: Full pick).
// StillContext still wins.
export const FullMotionContext = createContext(false)

/** Whether the viewer asked for reduced motion. A stage shows its still; parts skip their tweens. */
export function useReducedMotion() {
  const still = useContext(StillContext)
  const full = useContext(FullMotionContext)
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return still || (reduced && !full)
}
