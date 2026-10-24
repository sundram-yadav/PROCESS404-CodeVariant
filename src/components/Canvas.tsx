import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { GripVertical, MoveDown } from 'lucide-react'

/**
 * THE CANVAS PROTOCOL
 * Every primary action in ORIGANO (save, add, delete, complete, export …) is performed by
 * dragging a data card into an Action Zone. There are no action buttons.
 *
 *  - Mouse / pen: press a card and drag it. Touch: drag a card by its grip handle.
 *  - Keyboard: focus a card, press Space/Enter to lift it, ←/→ to choose a zone,
 *    Enter/Space to drop, Esc to cancel.
 *  - Files: an Action Zone can also accept real files dragged in from the desktop (Import).
 */

export interface DragPayload { kind: string; id?: string; label: string; data?: unknown }

export interface ZoneDef {
  id: string
  label: string
  hint: string
  icon: ReactNode
  accepts: string[]
  tone?: 'primary' | 'danger' | 'success' | 'neutral'
  onDrop: (payload: DragPayload) => void
  onFiles?: (files: File[]) => void
}

interface Registration { accepts: string[]; label: string; onDrop: (payload: DragPayload) => void }

interface CanvasContextValue {
  dragging: DragPayload | null
  hover: string | null
  flash: string | null
  rejected: string | null
  arm: (payload: DragPayload, event: ReactPointerEvent) => void
  lift: (payload: DragPayload) => void
  register: (id: string, registration: Registration) => () => void
  flashZone: (id: string) => void
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

function useCanvas(): CanvasContextValue {
  const value = useContext(CanvasContext)
  if (!value) throw new Error('Canvas components must be rendered inside <CanvasProvider>.')
  return value
}

const DRAG_THRESHOLD = 6
const sameCard = (a: DragPayload | null, b: DragPayload) => Boolean(a) && a!.kind === b.kind && (a!.id ?? '') === (b.id ?? '')

export function CanvasProvider({ children, onReject }: { children: ReactNode; onReject?: (payload: DragPayload, zoneLabel: string) => void }) {
  const zones = useRef(new Map<string, Registration>())
  const [dragging, setDragging] = useState<DragPayload | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [rejected, setRejected] = useState<string | null>(null)
  const [live, setLive] = useState('')
  const ghostRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<DragPayload | null>(null)
  const hoverRef = useRef<string | null>(null)
  const overRef = useRef<string | null>(null)
  const liftedRef = useRef(false)
  const pointer = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const onRejectRef = useRef(onReject)
  useEffect(() => { onRejectRef.current = onReject })

  const setHoverZone = useCallback((id: string | null) => { hoverRef.current = id; setHover(id) }, [])

  const placeGhost = useCallback(() => {
    const ghost = ghostRef.current
    if (ghost) ghost.style.transform = `translate3d(${pointer.current.x + 16}px, ${pointer.current.y + 14}px, 0)`
  }, [])
  useLayoutEffect(() => { if (dragging) placeGhost() }, [dragging, placeGhost])

  const flashZone = useCallback((id: string) => {
    setFlash(id)
    window.setTimeout(() => setFlash((current) => current === id ? null : current), 750)
  }, [])

  const register = useCallback((id: string, registration: Registration) => {
    zones.current.set(id, registration)
    return () => { if (zones.current.get(id) === registration) zones.current.delete(id) }
  }, [])

  const acceptingZones = useCallback((payload: DragPayload) => {
    const order = Array.from(document.querySelectorAll<HTMLElement>('[data-zone-id]')).map((node) => node.dataset.zoneId ?? '')
    return order.filter((id) => zones.current.get(id)?.accepts.includes(payload.kind))
  }, [])

  const finish = useCallback((drop: boolean) => {
    const payload = draggingRef.current
    const target = hoverRef.current
    const over = overRef.current
    overRef.current = null
    cancelAnimationFrame(rafRef.current)
    document.body.classList.remove('canvas-dragging')
    draggingRef.current = null
    liftedRef.current = false
    setDragging(null)
    setHoverZone(null)
    if (!payload) return
    const zone = target ? zones.current.get(target) : undefined
    if (drop && target && zone && zone.accepts.includes(payload.kind)) {
      flashZone(target)
      setLive(`${payload.label} dropped on ${zone.label}.`)
      zone.onDrop(payload)
    } else if (drop && over && zones.current.has(over)) {
      const label = zones.current.get(over)?.label ?? ''
      setRejected(over)
      window.setTimeout(() => setRejected((current) => current === over ? null : current), 500)
      setLive(`${payload.label} cannot be dropped on ${label}.`)
      onRejectRef.current?.(payload, label)
    } else if (drop) {
      setLive('Drop cancelled. Drop the card on a highlighted action zone.')
    }
  }, [flashZone, setHoverZone])

  const hitTest = useCallback((x: number, y: number) => {
    const payload = draggingRef.current
    if (!payload) return
    const node = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-zone-id]')
    const id = node?.dataset.zoneId ?? null
    overRef.current = id
    const zone = id ? zones.current.get(id) : undefined
    const next = id && zone && zone.accepts.includes(payload.kind) ? id : null
    if (next !== hoverRef.current) setHoverZone(next)
  }, [setHoverZone])

  const autoScroll = useCallback(() => {
    if (!draggingRef.current || liftedRef.current) return
    const { y } = pointer.current
    const edge = 90
    const bottomEdge = window.innerHeight - 150
    if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 5))
    else if (y > bottomEdge && y < window.innerHeight - 100) window.scrollBy(0, Math.ceil((y - bottomEdge) / 5))
    rafRef.current = requestAnimationFrame(autoScroll)
  }, [])

  const arm = useCallback((payload: DragPayload, event: ReactPointerEvent) => {
    if (event.button !== 0 || draggingRef.current) return
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, select, a, [data-nodrag]')) return
    // On touch screens only the grip handle starts a drag, so the page can still scroll.
    if (event.pointerType === 'touch' && !target.closest('.dnd-grip')) return
    const startX = event.clientX
    const startY = event.clientY
    let active = false

    const move = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY }
      if (!active) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return
        active = true
        draggingRef.current = payload
        document.body.classList.add('canvas-dragging')
        window.getSelection()?.removeAllRanges()
        setDragging(payload)
        setLive(`Dragging ${payload.label}.`)
        rafRef.current = requestAnimationFrame(autoScroll)
      }
      placeGhost()
      hitTest(e.clientX, e.clientY)
    }
    const end = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      if (!active) return
      if (e.type !== 'pointercancel') {
        pointer.current = { x: e.clientX, y: e.clientY }
        hitTest(e.clientX, e.clientY)
      }
      finish(e.type === 'pointerup')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }, [autoScroll, finish, hitTest, placeGhost])

  const lift = useCallback((payload: DragPayload) => {
    if (draggingRef.current) return
    const options = acceptingZones(payload)
    draggingRef.current = payload
    liftedRef.current = true
    pointer.current = { x: window.innerWidth / 2, y: window.innerHeight - 140 }
    setDragging(payload)
    setHoverZone(options[0] ?? null)
    setLive(`Picked up ${payload.label}. Use the arrow keys to choose an action zone, Enter to drop, Escape to cancel.`)
  }, [acceptingZones, setHoverZone])

  useEffect(() => {
    if (!dragging || !liftedRef.current) return
    const onKey = (event: KeyboardEvent) => {
      const payload = draggingRef.current
      if (!payload) return
      const options = acceptingZones(payload)
      const index = Math.max(0, options.indexOf(hoverRef.current ?? ''))
      const go = (next: number) => {
        if (!options.length) return
        const id = options[(next + options.length) % options.length]
        setHoverZone(id)
        document.querySelector<HTMLElement>(`[data-zone-id="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
        setLive(`${zones.current.get(id)?.label ?? 'Zone'} selected.`)
      }
      if (event.key === 'Escape') { event.preventDefault(); finish(false); setLive('Cancelled.') }
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) { event.preventDefault(); go(index + 1) }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) { event.preventDefault(); go(index - 1) }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); finish(Boolean(hoverRef.current)) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [dragging, acceptingZones, finish, setHoverZone])

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); document.body.classList.remove('canvas-dragging') }, [])

  const value = useMemo<CanvasContextValue>(() => ({ dragging, hover, flash, rejected, arm, lift, register, flashZone }), [dragging, hover, flash, rejected, arm, lift, register, flashZone])

  return (
    <CanvasContext.Provider value={value}>
      {children}
      {dragging && <div ref={ghostRef} className="drag-ghost" aria-hidden="true"><GripVertical size={14} />{dragging.label}</div>}
      <p className="sr-only" role="status" aria-live="assertive">{live}</p>
    </CanvasContext.Provider>
  )
}

/** A piece of data (event, task, idea, draft form …) that can be dragged into an Action Zone. */
export function DataCard({ payload, disabled, lockedReason, className = '', children, as: Tag = 'article' }: {
  payload: DragPayload
  disabled?: boolean
  lockedReason?: string
  className?: string
  children: ReactNode
  as?: 'article' | 'div' | 'section'
}) {
  const { dragging, arm, lift } = useCanvas()
  const lifted = sameCard(dragging, payload)
  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (disabled || event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lift(payload) }
  }
  return (
    <Tag
      className={`data-card ${disabled ? 'is-locked' : ''} ${lifted ? 'is-lifted' : ''} ${className}`}
      tabIndex={disabled ? undefined : 0}
      aria-roledescription={disabled ? undefined : 'draggable card'}
      aria-label={disabled ? undefined : `${payload.label}. Press Space to lift, then choose an action zone.`}
      title={disabled ? lockedReason : undefined}
      onPointerDown={disabled ? undefined : (event) => { event.stopPropagation(); arm(payload, event) }}
      onKeyDown={onKeyDown}
    >
      {!disabled && <span className="dnd-grip" aria-hidden="true"><GripVertical size={16} /></span>}
      {children}
    </Tag>
  )
}

function ActionZone({ zone }: { zone: ZoneDef }) {
  const { dragging, hover, flash, rejected, register } = useCanvas()
  useEffect(() => register(zone.id, { accepts: zone.accepts, label: zone.label, onDrop: zone.onDrop }))
  const armed = dragging ? zone.accepts.includes(dragging.kind) : false
  const [fileOver, setFileOver] = useState(false)
  const className = [
    'action-zone', `tone-${zone.tone ?? 'neutral'}`,
    armed ? 'is-armed' : '', dragging && !armed ? 'is-dim' : '',
    hover === zone.id || fileOver ? 'is-over' : '', flash === zone.id ? 'is-flash' : '', rejected === zone.id ? 'is-rejected' : '',
  ].filter(Boolean).join(' ')
  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files')
  return (
    <div
      className={className}
      data-zone-id={zone.id}
      role="group"
      aria-label={`${zone.label} action zone. ${zone.hint}`}
      onDragOver={zone.onFiles ? (event) => { if (hasFiles(event)) { event.preventDefault(); setFileOver(true) } } : undefined}
      onDragLeave={zone.onFiles ? () => setFileOver(false) : undefined}
      onDrop={zone.onFiles ? (event) => {
        if (!hasFiles(event)) return
        event.preventDefault(); setFileOver(false)
        zone.onFiles?.(Array.from(event.dataTransfer.files))
      } : undefined}
    >
      <span className="zone-icon">{zone.icon}</span>
      <strong>{zone.label}</strong>
      <small>{hover === zone.id && dragging ? 'Release to drop' : zone.hint}</small>
    </div>
  )
}

/** The dock of Action Zones fixed to the bottom of the canvas. */
export function ActionDock({ zones, title = 'Action zones' }: { zones: ZoneDef[]; title?: string }) {
  const { dragging } = useCanvas()
  if (!zones.length) return null
  return (
    <section className={`action-dock ${dragging ? 'is-active' : ''}`} aria-label={title}>
      <p className="dock-label"><MoveDown size={13} aria-hidden="true" /> {dragging ? `Drop “${dragging.label}” on a glowing zone` : 'Drag a card into a zone'}</p>
      <div className="dock-zones">{zones.map((zone) => <ActionZone key={zone.id} zone={zone} />)}</div>
    </section>
  )
}