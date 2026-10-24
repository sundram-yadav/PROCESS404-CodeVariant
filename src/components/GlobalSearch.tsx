import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import { CalendarDays, Lightbulb, ListChecks, MessageSquareText, Clock3, NotebookPen, Search, CornerDownLeft, Compass } from 'lucide-react'
import type { WorkspaceState } from '../model'

export interface SearchHit { key: string; group: string; title: string; meta: string; page: string; query?: string }

const GROUP_ICON: Record<string, ReactNode> = {
  Pages: <Compass size={15} />, Events: <CalendarDays size={15} />, Feedback: <MessageSquareText size={15} />,
  Actions: <ListChecks size={15} />, Ideas: <Lightbulb size={15} />, Milestones: <Clock3 size={15} />, Reflections: <NotebookPen size={15} />,
}

/** Workspace-wide search: pages, events, feedback, actions, ideas, milestones and reflections. Press "/" or Ctrl/⌘+K to focus. */
export default function GlobalSearch({ workspace, pages, onSelect }: {
  workspace: WorkspaceState
  pages: Array<{ id: string; label: string }>
  onSelect: (hit: SearchHit) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const has = (...parts: Array<string | undefined>) => parts.join(' ').toLowerCase().includes(q)
    const out: SearchHit[] = []
    const add = (list: SearchHit[]) => out.push(...list.slice(0, 4))
    add(pages.filter((page) => has(page.label)).map((page) => ({ key: `p-${page.id}`, group: 'Pages', title: page.label, meta: 'Open page', page: page.id })))
    add(workspace.events.filter((item) => has(item.name, item.type, item.description, item.role, item.outcome)).map((item) => ({ key: `e-${item.id}`, group: 'Events', title: item.name, meta: `${item.type} · ${item.date}`, page: 'events', query: item.name })))
    add(workspace.feedback.filter((item) => has(item.source, item.text, ...item.suggestions.map((s) => s.title))).map((item) => ({ key: `f-${item.id}`, group: 'Feedback', title: item.text.slice(0, 70) + (item.text.length > 70 ? '…' : ''), meta: item.source, page: 'feedback', query: item.text.slice(0, 40) })))
    add(workspace.tasks.filter((item) => has(item.title, item.description)).map((item) => ({ key: `t-${item.id}`, group: 'Actions', title: item.title, meta: `${item.status.replace('_', ' ')} · ${item.priority} priority`, page: 'actions', query: item.title })))
    add(workspace.ideas.filter((item) => has(item.title, item.problem, item.solution, item.domain, item.skills)).map((item) => ({ key: `i-${item.id}`, group: 'Ideas', title: item.title, meta: item.status, page: 'ideas', query: item.title })))
    add(workspace.milestones.filter((item) => has(item.title, item.description)).map((item) => ({ key: `m-${item.id}`, group: 'Milestones', title: item.title, meta: `${item.window} · due ${item.dueDate}`, page: 'timeline' })))
    add(workspace.reflections.filter((item) => has(...Object.values(item.answers))).map((item) => ({ key: `r-${item.id}`, group: 'Reflections', title: workspace.events.find((e) => e.id === item.eventId)?.name ?? 'Reflection', meta: 'Matches one of your answers', page: 'reflection' })))
    return out.slice(0, 12)
  }, [query, workspace, pages])

  useEffect(() => { setActive(0) }, [query])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((event.target as HTMLElement)?.tagName ?? '') || (event.target as HTMLElement)?.isContentEditable
      if ((event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey))) {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    const onDown = (event: MouseEvent) => { if (!boxRef.current?.contains(event.target as Node)) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown) }
  }, [])

  const choose = (hit: SearchHit) => {
    onSelect(hit)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }
  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur() }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((value) => Math.min(hits.length - 1, value + 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((value) => Math.max(0, value - 1)) }
    else if (event.key === 'Enter' && hits[active]) { event.preventDefault(); choose(hits[active]) }
  }

  let lastGroup = ''
  return (
    <div className="global-search" ref={boxRef} role="search">
      <Search size={16} aria-hidden="true" />
      <input
        ref={inputRef} type="search" value={query} placeholder="Search everything…" aria-label="Search your workspace"
        aria-expanded={open && Boolean(query.trim())} aria-controls="global-search-results" autoComplete="off"
        onChange={(event) => { setQuery(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
      />
      <kbd aria-hidden="true">/</kbd>
      {open && query.trim() && (
        <div className="search-results" id="global-search-results" role="listbox">
          {hits.length === 0 && <p className="search-empty">No matches for “{query.trim()}”.</p>}
          {hits.map((hit, index) => {
            const header = hit.group !== lastGroup ? <p className="search-group">{hit.group}</p> : null
            lastGroup = hit.group
            return (
              <div key={hit.key}>
                {header}
                <button type="button" role="option" aria-selected={index === active} className={`search-hit ${index === active ? 'is-active' : ''}`} onMouseEnter={() => setActive(index)} onClick={() => choose(hit)}>
                  <span className="search-hit-icon">{GROUP_ICON[hit.group]}</span>
                  <span className="search-hit-text"><strong>{hit.title}</strong><small>{hit.meta}</small></span>
                  {index === active && <CornerDownLeft size={14} aria-hidden="true" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}