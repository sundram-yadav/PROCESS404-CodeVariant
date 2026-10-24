import type { CSSProperties, PointerEvent } from 'react'

/** Decorative CSS-3D scene (no WebGL needed, so it can never fail to load). */
export default function Scene3D() {
  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const box = e.currentTarget.getBoundingClientRect()
    const stack = e.currentTarget.firstElementChild as HTMLElement
    stack.style.setProperty('--rx', String(((e.clientX - box.left) / box.width - 0.5) * 36))
    stack.style.setProperty('--ry', String(-((e.clientY - box.top) / box.height - 0.5) * 24))
  }
  return (
    <div className="scene" aria-hidden="true" onPointerMove={tilt}>
      <div className="stack" style={{} as CSSProperties}>
        <div className="lay l1" />
        <div className="lay l2">
          <svg viewBox="0 0 200 150" width="100%" height="100%" preserveAspectRatio="none"><path d="M0 0C8 70 55 92 118 96 162 99 190 128 200 150H0Z" fill="#078080" stroke="#232323" strokeWidth="3" /></svg>
        </div>
        <div className="lay l3"><i /><i className="c" /></div>
        <svg className="sun" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="#078080" stroke="#232323" strokeWidth="3" /><path d="M26 36q4-5 8 0M46 36q4-5 8 0M30 50q10 9 20 0" fill="none" stroke="#fffffe" strokeWidth="3" strokeLinecap="round" /></svg>
      </div>
    </div>
  )
}
