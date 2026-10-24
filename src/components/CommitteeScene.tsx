import { memo, useCallback, useEffect, useRef, useState } from 'react'

/*
  CommitteeScene
  ----------------------------------------------------------------
  Six hand-drawn SVG stickmen (the organising committee) stand in front of
  an "Action plan" board. Every smiley face follows the cursor, blinks, and
  the figure nearest to the cursor waves. No emoji, no images, no libraries.
  Styles are injected from this file so nothing else needs to change.
*/

type PropKind = 'clipboard' | 'book' | 'scorecard' | 'tablet' | 'pencil' | 'flag'
type HeadKind = 'badge' | 'glasses' | 'cap' | 'spikes' | 'beret' | 'band'

interface Member {
  role: string
  color: string
  prop: PropKind
  head: HeadKind
  quote: string
  task: string
  x: number
  y: number
  s: number
}

const INK = '#2b2118'
const SUN = '#ffcf6b'

const MEMBERS: Member[] = [
  { role: 'Organizer', color: '#e8730c', prop: 'clipboard', head: 'badge', quote: 'Book the follow-up call before everyone leaves.', task: 'Book follow-up call', x: 46, y: 288, s: 1.1 },
  { role: 'Mentor', color: '#0a9393', prop: 'book', head: 'glasses', quote: 'Show the problem first, then the solution.', task: 'Reorder the pitch', x: 114, y: 270, s: 0.98 },
  { role: 'Judge', color: '#f45d48', prop: 'scorecard', head: 'cap', quote: 'Tighten the demo to three minutes.', task: 'Tighten the demo', x: 182, y: 288, s: 1.1 },
  { role: 'Participant', color: '#ff9f1c', prop: 'tablet', head: 'spikes', quote: 'Which feedback do we fix first?', task: 'Rank the feedback', x: 250, y: 270, s: 0.98 },
  { role: 'Designer', color: '#b8540a', prop: 'pencil', head: 'beret', quote: 'The flow needs one step less.', task: 'Cut one step from the flow', x: 318, y: 288, s: 1.1 },
  { role: 'Volunteer', color: '#14403f', prop: 'flag', head: 'band', quote: 'I will collect everyone’s contacts.', task: 'Save new contacts', x: 386, y: 270, s: 0.98 },
]

const BOARD_ROWS = ['Tighten the demo', 'Email the mentors', 'Book a retro call']

/* draw order: back row (smaller y) first so front figures overlap it */
const DRAW_ORDER = MEMBERS.map((_, i) => i).sort((a, b) => MEMBERS[a].y - MEMBERS[b].y)

function starPoints(cx: number, cy: number, R: number, r: number) {
  const pts: string[] = []
  for (let k = 0; k < 10; k++) {
    const rad = k % 2 === 0 ? R : r
    const a = (Math.PI / 5) * k - Math.PI / 2
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`)
  }
  return pts.join(' ')
}

function HeldProp({ kind, color }: { kind: PropKind; color: string }) {
  switch (kind) {
    case 'clipboard':
      return (
        <g>
          <rect x="12" y="-45" width="16" height="21" rx="2.5" fill="#fffaf2" stroke={INK} strokeWidth="1.8" />
          <rect x="16" y="-47.5" width="8" height="4.5" rx="1.5" fill={color} stroke={INK} strokeWidth="1.4" />
          <path d="M16 -37h8M16 -33h8M16 -29h5" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    case 'book':
      return (
        <g>
          <rect x="11" y="-40" width="17" height="12" rx="1.8" fill={color} stroke={INK} strokeWidth="1.8" />
          <path d="M14.5 -40v12" stroke={INK} strokeWidth="1.4" />
          <path d="M18 -35h7M18 -32h5" stroke="#fffaf2" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    case 'scorecard':
      return (
        <g>
          <rect x="11" y="-46" width="18" height="22" rx="2.5" fill="#fffaf2" stroke={INK} strokeWidth="1.8" />
          <polygon points={starPoints(20, -36, 6.2, 2.6)} fill="#ff9f1c" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )
    case 'tablet':
      return (
        <g>
          <rect x="11" y="-42" width="14" height="19" rx="2.6" fill="#14403f" stroke={INK} strokeWidth="1.8" />
          <path d="M14.5 -37h7M14.5 -33h7M14.5 -29h4" stroke="#ffbf47" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )
    case 'pencil':
      return (
        <g>
          <path d="M14 -29L27 -49" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <path d="M14 -29L27 -49" stroke="#ffbf47" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M11.5 -25.5l2.2 -4.2 2.6 1.7z" fill="#fffaf2" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )
    case 'flag':
      return (
        <g>
          <path d="M16 -22V-58" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16.8 -58L33 -52L16.8 -45.5Z" fill="#f45d48" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      )
  }
}

function HeadGear({ kind }: { kind: HeadKind }) {
  switch (kind) {
    case 'cap':
      return (
        <g>
          <path d="M-12.4 -68.5Q-12 -83 0 -83Q12 -83 12.4 -68.5Q0 -73 -12.4 -68.5Z" fill="#14403f" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M-12.4 -68.5Q0 -73 12.4 -68.5" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'spikes':
      return <path d="M-9 -74.5L-7 -83L-2.8 -76L0.5 -85L4 -76.2L8.5 -82.5L10 -73" fill={INK} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    case 'beret':
      return (
        <g>
          <ellipse cx="-1.5" cy="-76" rx="13" ry="5.2" fill="#f45d48" stroke={INK} strokeWidth="2" />
          <circle cx="-1.5" cy="-81" r="1.8" fill="#f45d48" stroke={INK} strokeWidth="1.5" />
        </g>
      )
    case 'band':
      return (
        <g>
          <path d="M-12.6 -69.5Q0 -76.5 12.6 -69.5" stroke={INK} strokeWidth="5.2" fill="none" strokeLinecap="round" />
          <path d="M-12.6 -69.5Q0 -76.5 12.6 -69.5" stroke="#0a9393" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </g>
      )
    default:
      return null
  }
}

interface StickmanProps {
  i: number
  m: Member
  onActive: (i: number | null) => void
  reg: (i: number, el: SVGGElement | null) => void
}

const Stickman = memo(function Stickman({ i, m, onActive, reg }: StickmanProps) {
  const tagW = m.role.length * 6.1 + 18
  return (
    <g
      ref={(el) => reg(i, el)}
      className="ogs-fig"
      transform={`translate(${m.x} ${m.y}) scale(${m.s})`}
      tabIndex={0}
      role="img"
      aria-label={`${m.role}: ${m.quote}`}
      onPointerEnter={() => onActive(i)}
      onPointerLeave={() => onActive(null)}
      onFocus={() => onActive(i)}
      onBlur={() => onActive(null)}
    >
      <ellipse cx="0" cy="1.5" rx="15" ry="3.2" fill="rgba(110,70,30,.2)" />
      <g className="ogs-rise" style={{ ['--i' as string]: i }}>
        <rect x="-21" y="-92" width="42" height="96" fill="transparent" />
        <ellipse className="ogs-ring" cx="0" cy="-42" rx="24" ry="52" fill="none" stroke={m.color} strokeWidth="1.6" strokeDasharray="4 4" />

        {/* legs */}
        <path d="M0 -27L-8 -1.5L-13.5 0M0 -27L8 -1.5L13.5 0" stroke={INK} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        <g data-p="upper">
          {/* torso (shirt in role colour) */}
          <path d="M0 -50L0 -26" stroke={INK} strokeWidth="9.4" strokeLinecap="round" />
          <path d="M0 -50L0 -26" stroke={m.color} strokeWidth="6" strokeLinecap="round" />
          {m.head === 'badge' && (
            <g>
              <path d="M-4.5 -49L0 -39.5L4.5 -49" stroke="#fffaf2" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="-4" y="-40" width="8" height="9" rx="1.6" fill="#fffaf2" stroke={INK} strokeWidth="1.4" />
              <circle cx="0" cy="-36.5" r="1.7" fill="#ff9f1c" />
            </g>
          )}

          {/* left arm */}
          <g data-p="armL">
            <path d="M0 -46L-12.5 -33L-15 -25.5" stroke={INK} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="-15" cy="-25" r="2.4" fill={SUN} stroke={INK} strokeWidth="1.4" />
          </g>

          {/* right arm + held prop (this one waves) */}
          <g data-p="armR">
            <HeldProp kind={m.prop} color={m.color} />
            <path d="M0 -46L12.5 -33L14 -28" stroke={INK} strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="14" cy="-27.5" r="2.4" fill={SUN} stroke={INK} strokeWidth="1.4" />
          </g>

          {/* head */}
          <g data-p="head">
            <circle data-p="skull" cx="0" cy="-64" r="13.2" fill={SUN} stroke={INK} strokeWidth="2.7" />
            <HeadGear kind={m.head} />
            <g data-p="face">
              <circle cx="-8.3" cy="-60.2" r="2.5" fill="#f45d48" opacity=".32" />
              <circle cx="8.3" cy="-60.2" r="2.5" fill="#f45d48" opacity=".32" />
              <g data-p="eyes">
                <ellipse data-p="eyeL" cx="-4.6" cy="-66" rx="1.9" ry="2.4" fill={INK} />
                <ellipse data-p="eyeR" cx="4.6" cy="-66" rx="1.9" ry="2.4" fill={INK} />
              </g>
              {m.head === 'glasses' && (
                <g fill="none" stroke={INK} strokeWidth="1.6">
                  <circle cx="-4.6" cy="-66" r="5" />
                  <circle cx="4.6" cy="-66" r="5" />
                  <path d="M-0.2 -66h0.4" strokeLinecap="round" />
                </g>
              )}
              <path data-p="mouth" d="M-5.4 -60.6Q0 -56.4 5.4 -60.6" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </g>
        </g>

        {/* role label */}
        <g className="ogs-tag" transform="translate(0 -98)">
          <rect x={-tagW / 2} y="-9" width={tagW} height="16" rx="8" fill={m.color} />
          <text x="0" y="2.6" textAnchor="middle" fontSize="9.4" fontWeight="800" fill="#fffaf2">
            {m.role}
          </text>
        </g>
      </g>
    </g>
  )
})

/* ------------------------------------------------------------------ */

interface Dom {
  upper: SVGGElement | null
  head: SVGGElement | null
  face: SVGGElement | null
  eyes: SVGGElement | null
  eyeL: SVGEllipseElement | null
  eyeR: SVGEllipseElement | null
  mouth: SVGPathElement | null
  armR: SVGGElement | null
  armL: SVGGElement | null
  skull: SVGCircleElement | null
}

interface Pose {
  x: number
  y: number
  wave: number
  blinkAt: number
}

const css = `
.ogs { width: 100%; max-width: 470px; justify-self: center; }
.ogs-card {
  position: relative; padding: 16px 14px 14px; border-radius: 30px; overflow: hidden;
  background: var(--neo-bg, #f5ede3); box-shadow: var(--neo-raised, 9px 9px 20px #d8c7b2, -9px -9px 20px #fffaf2);
}
.ogs-card::before {
  content: ''; position: absolute; left: 26px; top: 0; width: 64px; height: 6px; border-radius: 0 0 6px 6px;
  background: linear-gradient(90deg, var(--saffron, #ff9f1c), var(--coral, #f45d48));
}
.ogs-svg { display: block; width: 100%; height: auto; overflow: visible; font-family: inherit; touch-action: pan-y; }
.ogs-board { filter: drop-shadow(5px 6px 7px rgba(140, 110, 80, .28)) drop-shadow(-4px -4px 6px rgba(255, 250, 242, .95)); }
.ogs-fig { outline: none; cursor: default; }
.ogs-ring, .ogs-tag { opacity: 0; transition: opacity .18s ease; pointer-events: none; }
.ogs-fig:hover .ogs-tag, .ogs-fig:focus-visible .ogs-tag, .ogs-fig:focus-visible .ogs-ring { opacity: 1; }
.ogs-rise { transform-box: fill-box; transform-origin: 50% 100%; animation: ogs-rise .75s cubic-bezier(.2, 1.35, .4, 1) both; animation-delay: calc(var(--i) * .1s + .15s); }
.ogs-check { stroke-dasharray: 16; stroke-dashoffset: 16; animation: ogs-tick 10s ease-in-out infinite both; animation-delay: calc(var(--k) * 1.7s); }
.ogs-box { animation: ogs-fill 10s ease-in-out infinite both; animation-delay: calc(var(--k) * 1.7s); }
.ogs-strike { transform-box: fill-box; transform-origin: 0 50%; transform: scaleX(0); animation: ogs-strike 10s ease-in-out infinite both; animation-delay: calc(var(--k) * 1.7s); }
.ogs-say {
  display: grid; gap: 3px; margin-top: 4px; padding: 11px 16px; min-height: 66px; align-content: center; border-radius: 18px;
  text-align: center; box-shadow: var(--neo-pressed-sm, inset 3px 3px 7px #d8c7b2, inset -3px -3px 7px #fffaf2);
  animation: ogs-pop .45s ease both;
}
.ogs-who { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; font-weight: 800; color: #14403f; }
.ogs-who i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px rgba(255, 255, 255, .55); }
.ogs-quote { margin: 0; font-size: 14px; font-weight: 700; color: var(--ink, #2b2118); line-height: 1.4; }
.ogs-task { font-size: 12px; font-weight: 700; color: var(--burnt, #b8540a); }
@keyframes ogs-rise { from { opacity: 0; transform: translateY(14px) scale(.4, .2); } to { opacity: 1; transform: none; } }
@keyframes ogs-tick { 0%, 8% { stroke-dashoffset: 16; } 15%, 78% { stroke-dashoffset: 0; } 92%, 100% { stroke-dashoffset: 16; } }
@keyframes ogs-fill { 0%, 8% { fill: rgba(255, 159, 28, 0); } 15%, 78% { fill: #ee7d10; } 92%, 100% { fill: rgba(255, 159, 28, 0); } }
@keyframes ogs-strike { 0%, 10% { transform: scaleX(0); } 20%, 78% { transform: scaleX(1); } 92%, 100% { transform: scaleX(0); } }
@keyframes ogs-pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ogs-rise, .ogs-say { animation: none; }
  .ogs-check, .ogs-box, .ogs-strike { animation: none; }
  .ogs-check { stroke-dashoffset: 0; }
  .ogs-box { fill: #ee7d10; }
  .ogs-strike { transform: scaleX(1); }
}
`

export default function CommitteeScene() {
  const domRef = useRef<Dom[]>(MEMBERS.map(() => ({ upper: null, head: null, face: null, eyes: null, eyeL: null, eyeR: null, mouth: null, armR: null, armL: null, skull: null })))
  const poseRef = useRef<Pose[]>(MEMBERS.map((_, i) => ({ x: 0, y: -0.2, wave: 0, blinkAt: 1200 + i * 700 })))
  const activeRef = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [pin, setPin] = useState<number | null>(null)
  const [auto, setAuto] = useState(2)

  const reg = useCallback((i: number, el: SVGGElement | null) => {
    if (!el) return
    const q = <T extends Element>(k: string) => el.querySelector<T>(`[data-p="${k}"]`)
    domRef.current[i] = {
      upper: q<SVGGElement>('upper'),
      head: q<SVGGElement>('head'),
      face: q<SVGGElement>('face'),
      eyes: q<SVGGElement>('eyes'),
      eyeL: q<SVGEllipseElement>('eyeL'),
      eyeR: q<SVGEllipseElement>('eyeR'),
      mouth: q<SVGPathElement>('mouth'),
      armR: q<SVGGElement>('armR'),
      armL: q<SVGGElement>('armL'),
      skull: q<SVGCircleElement>('skull'),
    }
  }, [])

  const onActive = useCallback((i: number | null) => {
    activeRef.current = i
    setPin(i)
  }, [])

  /* rotate the caption every few seconds unless a figure is hovered/focused */
  useEffect(() => {
    if (pin !== null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setAuto((a) => (a + 1) % MEMBERS.length), 3800)
    return () => window.clearInterval(id)
  }, [pin])

  /* cursor tracking + idle life, all driven by one rAF loop */
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: 0, y: 0, t: -1e9 }
    let visible = true
    let raf = 0

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.t = performance.now()
    }
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) mouse.t = -1e9
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('mouseout', onOut)

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting })
    if (stageRef.current) io.observe(stageRef.current)

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (!visible || document.hidden) return

      const dom = domRef.current
      const pose = poseRef.current
      const tracking = now - mouse.t < 3500

      /* read phase */
      const centres = dom.map((d) => {
        if (!d.skull) return null
        const r = d.skull.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })

      let nearest = -1
      let best = 230
      if (tracking && !reduce) {
        centres.forEach((c, i) => {
          if (!c) return
          const d = Math.hypot(mouse.x - c.x, mouse.y - c.y)
          if (d < best) { best = d; nearest = i }
        })
      }

      /* write phase */
      dom.forEach((d, i) => {
        const c = centres[i]
        const p = pose[i]
        if (!c || !d.upper || !d.head || !d.face) return

        let tx: number
        let ty: number
        if (tracking) {
          const dx = mouse.x - c.x
          const dy = mouse.y - c.y
          const dist = Math.hypot(dx, dy) || 1
          const k = Math.min(1, dist / 150)
          tx = (dx / dist) * k
          ty = (dy / dist) * k
        } else if (reduce) {
          tx = 0
          ty = -0.2
        } else {
          /* nobody is pointing: glance around the board and at each other */
          tx = Math.sin(now / 2300 + i * 1.7) * 0.6
          ty = -0.3 + Math.cos(now / 3100 + i * 0.9) * 0.2
        }
        p.x += (tx - p.x) * 0.14
        p.y += (ty - p.y) * 0.14

        const wantWave = !reduce && (i === nearest || i === activeRef.current) ? 1 : 0
        p.wave += (wantWave - p.wave) * 0.12

        const bob = reduce ? 0 : Math.sin(now / 650 + i * 1.3) * 0.9
        d.upper.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(${(p.x * 3.2).toFixed(2)} 0 -26)`)
        d.head.setAttribute('transform', `rotate(${(p.x * 9).toFixed(2)} 0 -64)`)
        d.face.setAttribute('transform', `translate(${(p.x * 4.6).toFixed(2)} ${(p.y * 3.4).toFixed(2)})`)
        if (d.eyes) d.eyes.setAttribute('transform', `translate(${(p.x * 0.7).toFixed(2)} ${(p.y * 0.6).toFixed(2)})`)

        /* blink */
        let open = 1
        if (now >= p.blinkAt) {
          open = 0.12
          if (now >= p.blinkAt + 130) p.blinkAt = now + 2200 + Math.random() * 3800
        }
        if (d.eyeL) d.eyeL.setAttribute('ry', (2.4 * open).toFixed(2))
        if (d.eyeR) d.eyeR.setAttribute('ry', (2.4 * open).toFixed(2))

        /* grin widens when the figure is waving at the cursor */
        if (d.mouth) {
          const w = 5.4 + p.wave * 0.9
          const dip = -56.4 + p.wave * 2.4
          d.mouth.setAttribute('d', `M${-w} -60.6Q0 ${dip.toFixed(2)} ${w} -60.6`)
        }

        if (d.armR) {
          const ang = -p.wave * (118 + Math.sin(now / 120 + i) * 15)
          d.armR.setAttribute('transform', `rotate(${ang.toFixed(2)} 0 -46)`)
        }
        if (d.armL) {
          const sway = reduce ? 0 : Math.sin(now / 900 + i * 1.1) * 4
          d.armL.setAttribute('transform', `rotate(${sway.toFixed(2)} 0 -46)`)
        }
      })
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  const shown = MEMBERS[pin ?? auto]

  return (
    <div className="committee ogs" ref={stageRef}>
      <style>{css}</style>
      <div className="ogs-card">
        <svg className="ogs-svg" viewBox="0 0 432 304" role="group" aria-label="The organising committee gathered around an action plan">
          <ellipse cx="216" cy="286" rx="206" ry="15" fill="rgba(232,115,12,.09)" />

          {/* action plan board */}
          <g className="ogs-board">
            <rect x="106" y="8" width="220" height="134" rx="18" fill="#f9f1e6" />
          </g>
          <rect x="106" y="24" width="6" height="22" rx="3" fill="#ee7d10" />
          <circle cx="314" cy="20" r="3.6" fill="#f45d48" stroke={INK} strokeWidth="1.2" />
          <text x="126" y="36" fontSize="12.5" fontWeight="800" fill="#14403f">Action plan</text>
          <text x="306" y="36" textAnchor="end" fontSize="10" fontWeight="700" fill="#b8540a">3 tasks</text>
          <path d="M126 46H306" stroke="rgba(140,110,80,.28)" strokeWidth="1.4" strokeLinecap="round" />
          {BOARD_ROWS.map((row, k) => {
            const cy = 70 + k * 26
            return (
              <g key={row} style={{ ['--k' as string]: k }}>
                <rect x="126" y={cy - 8} width="16" height="16" rx="5" fill="#f1e6d6" stroke="rgba(140,110,80,.5)" strokeWidth="1.2" />
                <rect className="ogs-box" x="126" y={cy - 8} width="16" height="16" rx="5" fill="rgba(255,159,28,0)" />
                <path className="ogs-check" d="M130 0l3.1 3.4 5.6 -7" transform={`translate(0 ${cy})`} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={16} />
                <text x="152" y={cy + 4} fontSize="11.5" fontWeight="700" fill={INK}>{row}</text>
                <rect className="ogs-strike" x="152" y={cy + 0.6} width={row.length * 5.35} height="1.8" rx=".9" fill="#b8540a" opacity=".75" />
              </g>
            )
          })}

          {DRAW_ORDER.map((i) => (
            <Stickman key={MEMBERS[i].role} i={i} m={MEMBERS[i]} onActive={onActive} reg={reg} />
          ))}
        </svg>

        <div className="ogs-say" key={shown.role} style={{ ['--c' as string]: shown.color }} aria-live="off">
          <span className="ogs-who"><i />{shown.role}</span>
          <p className="ogs-quote">“{shown.quote}”</p>
          <span className="ogs-task">Becomes a task: {shown.task}</span>
        </div>
      </div>
    </div>
  )
}