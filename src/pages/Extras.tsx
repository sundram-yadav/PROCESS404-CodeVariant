import { useState } from 'react'
import { Check, Globe, Heart, HeartOff, UserCheck, UserPlus, UserX, EyeOff } from 'lucide-react'
import { ActionDock, DataCard, type ZoneDef } from '../components/Canvas'
import type { IdeaRecord, WorkspaceState } from '../model'
import { OPPORTUNITIES, PEOPLE, type Extras, type Opportunity } from '../lib/extras'

interface Common { extras: Extras; onChange: (next: Extras) => void }

function Intro({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-copy">{detail}</p></div></div>
}

export function OpportunitiesPage({ ideas, extras, onChange }: Common & { ideas: IdeaRecord[] }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const mine: Opportunity[] = ideas.filter((i) => extras.published.includes(i.id)).map((i) => ({
    id: `idea-${i.id}`, title: i.title, description: i.problem, domain: i.domain || 'Idea', type: 'Your idea',
    skills: i.skills.split(',').map((s) => s.trim()).filter(Boolean), by: 'You (this browser only)',
  }))
  const list = [...mine, ...OPPORTUNITIES].filter((o) => (type === 'all' || o.type === type) && `${o.title} ${o.description} ${o.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const toggleInterest = (id: string) => {
    const interest = { ...extras.interest }
    if (interest[id]) delete interest[id]; else interest[id] = 'Interested'
    onChange({ ...extras, interest })
  }
  const makeInterestZones = (): ZoneDef[] => [
    { id: 'interest', label: 'Express interest', hint: 'Save to my interests', icon: <Heart size={16} />, accepts: ['opportunity'], tone: 'primary', onDrop: (p) => toggleInterest(p.id ?? '') },
    { id: 'withdraw', label: 'Withdraw', hint: 'Remove my interest', icon: <HeartOff size={16} />, accepts: ['opportunity-interested'], tone: 'danger', onDrop: (p) => toggleInterest(p.id ?? '') },
    { id: 'publish', label: 'Publish locally', hint: 'Add idea to this board', icon: <Globe size={16} />, accepts: ['idea-private'], tone: 'success', onDrop: (p) => togglePublish(p.id ?? '') },
    { id: 'unpublish', label: 'Unpublish', hint: 'Take idea off the board', icon: <EyeOff size={16} />, accepts: ['idea-public'], onDrop: (p) => togglePublish(p.id ?? '') },
  ]
  const togglePublish = (id: string) => onChange({ ...extras, published: extras.published.includes(id) ? extras.published.filter((x) => x !== id) : [...extras.published, id] })
  return (
    <section className="page-content">
      <ActionDock zones={makeInterestZones()} />
      <Intro eyebrow="SAMPLE DATA" title="Opportunities" detail="Sample listings bundled with the app. Drag a listing into Express interest (interest stays in this browser and is not sent to anyone). Real cross-user publishing needs a shared backend." />
      <div className="panel filter-row">
        <label>Search<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Skill, title or topic" /></label>
        <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All</option>{['Collaboration', 'Mentorship', 'Skill contribution', 'Project', 'Your idea'].map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      {list.length === 0 && <p className="muted">No matches. Try a different search.</p>}
      {list.map((o) => (
        <DataCard className="panel extra-item extra-card" key={o.id} payload={{ kind: extras.interest[o.id] ? 'opportunity-interested' : 'opportunity', id: o.id, label: o.title }}>
          <p className="eyebrow">{o.type} · {o.domain}</p><h2>{o.title}</h2><p>{o.description}</p>
          <p className="muted">Skills: {o.skills.join(', ') || 'Not specified'} · {o.by}</p>
          {extras.interest[o.id] ? <span className="status-chip"><Check size={12} /> {extras.interest[o.id]} · local only</span> : <span className="muted">Drag to Express interest</span>}
        </DataCard>
      ))}
      <div className="panel extra-item"><h2>Publish your ideas to this local board</h2>
        {ideas.length === 0 ? <p className="muted">Add an idea in the Idea vault first.</p> : ideas.map((i) => (
          <DataCard className="draft-card" key={i.id} payload={{ kind: extras.published.includes(i.id) ? 'idea-public' : 'idea-private', id: i.id, label: i.title }}>
            <span className="draft-kicker">{extras.published.includes(i.id) ? 'Published locally' : 'Private idea'}</span>
            <strong>{i.title}</strong>
            <small>{extras.published.includes(i.id) ? 'Drag to Unpublish to take it down.' : 'Drag to Publish locally to list it above.'}</small>
          </DataCard>
        ))}
      </div>
    </section>
  )
}

export function ConnectionsPage({ extras, onChange }: Common) {
  const [query, setQuery] = useState('')
  const people = PEOPLE.filter((p) => `${p.name} ${p.college} ${p.interest} ${p.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const set = (key: string, value?: string) => { const interest = { ...extras.interest }; if (value) interest[key] = value; else delete interest[key]; onChange({ ...extras, interest }) }
  const sent = PEOPLE.filter((p) => extras.interest[`c:${p.id}`])
  const connectZones: ZoneDef[] = [
    { id: 'connect', label: 'Connect', hint: 'Send a local request', icon: <UserPlus size={16} />, accepts: ['person'], tone: 'primary', onDrop: (d) => set(`c:${d.id}`, 'Request sent') },
    { id: 'cancel', label: 'Cancel request', hint: 'Withdraw request', icon: <UserX size={16} />, accepts: ['person-sent'], tone: 'danger', onDrop: (d) => set(`c:${d.id}`) },
    { id: 'accept', label: 'Accept', hint: 'Accept received request', icon: <UserCheck size={16} />, accepts: ['request'], tone: 'success', onDrop: () => set('r:p3', 'Accepted') },
    { id: 'decline', label: 'Decline', hint: 'Decline received request', icon: <UserX size={16} />, accepts: ['request'], onDrop: () => set('r:p3', 'Declined') },
  ]
  return (
    <section className="page-content">
      <ActionDock zones={connectZones} />
      <Intro eyebrow="SAMPLE DATA" title="Connections" detail="Fictional sample profiles. Drag a profile into Connect. Requests are saved only in this browser and are not delivered to anyone." />
      <div className="panel filter-row"><label>Search by name, college, skill or interest<input value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
      {people.length === 0 && <p className="muted">No matches.</p>}
      {people.map((p) => (
        <DataCard className="panel extra-item extra-card" key={p.id} payload={{ kind: extras.interest[`c:${p.id}`] ? 'person-sent' : 'person', id: p.id, label: p.name }}>
          <h2>{p.name}</h2><p className="muted">{p.college} · {p.interest}</p><p>Goal: {p.goal}</p><p className="muted">Skills: {p.skills.join(', ')}</p>
          {extras.interest[`c:${p.id}`] ? <span className="status-chip"><Check size={12} /> {extras.interest[`c:${p.id}`]} · local</span> : <span className="muted">Drag to Connect</span>}
        </DataCard>
      ))}
      <div className="panel extra-item"><h2>Sent requests</h2>{sent.length ? sent.map((p) => <p key={p.id}>{p.name}: {extras.interest[`c:${p.id}`]} (local)</p>) : <p className="muted">None yet.</p>}</div>
      <div className="panel extra-item"><h2>Received (demo)</h2>
        <DataCard className="draft-card" payload={{ kind: 'request', id: 'p3', label: 'Request from Kabir' }}>
          <span className="draft-kicker">{extras.interest['r:p3'] ?? 'Pending'}</span>
          <strong>Kabir (sample) would like to collaborate on a campus dashboard.</strong>
          <small>Drag into Accept or Decline.</small>
        </DataCard></div>
    </section>
  )
}

const THEMES: Array<[string, number]> = [['Onboarding clarity', 38], ['Problem validation', 27], ['Presentation', 21], ['Technical execution', 14]]

export function OrganizerPage({ workspace, extras }: { workspace: WorkspaceState; extras: Extras }) {
  const [role, setRole] = useState('Organizer')
  const answered = workspace.reflections.reduce((n, r) => n + Object.values(r.answers).filter((a) => a.trim()).length, 0)
  const done = workspace.tasks.filter((t) => t.status === 'done').length
  return (
    <section className="page-content">
      <Intro eyebrow="DEMO ROLE" title="Organizer insights" detail="The role switcher is a demonstration only, not real authorization." />
      <div className="panel filter-row"><label>Demo role<select value={role} onChange={(e) => setRole(e.target.value)}><option>Participant</option><option>Organizer</option></select></label></div>
      {role !== 'Organizer' ? <p className="muted">Switch to the Organizer demo role to view insights.</p> : <>
        <div className="panel extra-item"><h2>Sample data: not real statistics</h2><p className="muted">Invented numbers that show what an organizer dashboard could look like.</p>
          {THEMES.map(([label, v]) => <div className="bar-row" key={label}><span>{label}</span><div className="bar"><div style={{ width: `${v}%` }} /></div><b>{v}%</b></div>)}
          <p className="muted">Sample reflection completion 64% · action completion 41% · suggested improvement: clearer mentor feedback templates.</p></div>
        <div className="panel extra-item"><h2>This browser only</h2>
          <p>Reflection answers: <b>{answered}</b> · Tasks done: <b>{done}/{workspace.tasks.length}</b> · Ideas: <b>{workspace.ideas.length}</b> · Interests expressed: <b>{Object.keys(extras.interest).length}</b></p>
          <p className="muted">Your own local records, not organization-wide data.</p></div>
      </>}
    </section>
  )
}

export function ThanksPage({ onGo }: { onGo: (page: 'actions' | 'reflection') => void }) {
  return (
    <section className="page-content">
      <Intro eyebrow="SAVED" title="Thank you" detail="Your reflection is saved in this browser. Turn one answer into a task so it does not stay a thought." />
      <button className="button button-cta" type="button" onClick={() => onGo('actions')}>Open action plan</button>{' '}
      <button className="button button-secondary" type="button" onClick={() => onGo('reflection')}>Edit reflection</button>
    </section>
  )
}

export function NotFoundPage({ onHome }: { onHome: () => void }) {
  return (
    <section className="page-content">
      <Intro eyebrow="404" title="This page does not exist" detail="The address you opened is not part of ORIGANO. Your data is untouched." />
      <button className="button button-cta" type="button" onClick={onHome}>Back to workspace</button>
    </section>
  )
}