import { useEffect, useRef } from 'react'

const ORBITS = [0, 1, 2, 3, 4].map((i) => ({ r: 0.16 + i * 0.1, n: 5 + i * 2, s: (i % 2 ? -1 : 1) * (0.00012 + i * 0.00004) }))

/** Decorative orbiting-node canvas. Static when reduced motion is requested; paused when the tab is hidden. */
export default function OrbitBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0, h = 0, raf = 0
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.save(); ctx.translate(w * 0.74, h * 0.36); ctx.rotate(-0.35)
      const m = Math.min(w, h) * 1.1
      let prev: [number, number] | null = null
      for (const o of ORBITS) {
        const R = o.r * m
        ctx.strokeStyle = 'rgba(232,115,12,.20)'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.ellipse(0, 0, R, R * 0.42, 0, 0, 7); ctx.stroke()
        for (let k = 0; k < o.n; k++) {
          const a = (k / o.n) * 6.283 + t * o.s, x = Math.cos(a) * R, y = Math.sin(a) * R * 0.42
          ctx.fillStyle = k % 3 ? 'rgba(10,147,147,.55)' : 'rgba(255,159,28,.75)'
          ctx.beginPath(); ctx.arc(x, y, k % 3 ? 3 : 5, 0, 7); ctx.fill()
          if (k === 0) {
            if (prev) { ctx.strokeStyle = 'rgba(35,35,35,.12)'; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke() }
            prev = [x, y]
          }
        }
      }
      ctx.restore()
    }
    const fit = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; draw(performance.now()) }
    fit()
    window.addEventListener('resize', fit)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loop = (t: number) => { if (!document.hidden) draw(t); raf = requestAnimationFrame(loop) }
    if (!still) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit) }
  }, [])
  return <canvas ref={ref} className="orbit-bg" aria-hidden="true" />
}