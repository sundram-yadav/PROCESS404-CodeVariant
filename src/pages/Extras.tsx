import { useState } from 'react'
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
  const togglePublish = (id: string) => onChange({ ...extras, published: extras.published.includes(id) ? extras.published.filter((x) => x !== id) : [...extras.published, id] })
  return (
    <section className="page-content">
      <Intro eyebrow="SAMPLE DATA" title="Opportunities" detail="Sample listings bundled with the app. Interest is saved only in this browser and is not sent to anyone. Real cross-user publishing needs a shared backend." />
      <div className="panel filter-row">
        <label>Search<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Skill, title or topic" /></label>
        <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All</option>{['Collaboration', 'Mentorship', 'Skill contribution', 'Project', 'Your idea'].map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      {list.length === 0 && <p className="muted">No matches. Try a different search.</p>}
      {list.map((o) => (
        <article className="panel extra-item" key={o.id}>
          <p className="eyebrow">{o.type} · {o.domain}</p><h2>{o.title}</h2><p>{o.description}</p>
          <p className="muted">Skills: {o.skills.join(', ') || 'Not specified'} · {o.by}</p>
          <button className="button button-secondary compact" type="button" onClick={() => toggleInterest(o.id)}>{extras.interest[o.id] ? 'Withdraw interest' : 'Express interest'}</button>
          {extras.interest[o.id] && <span className="muted"> Status: {extras.interest[o.id]} (local only)</span>}
        </article>
      ))}
      <div className="panel extra-item"><h2>Publish your ideas to this local board</h2>
        {ideas.length === 0 ? <p className="muted">Add an idea in the Idea vault first.</p> : ideas.map((i) => (
          <p key={i.id}><button className="button button-secondary compact" type="button" onClick={() => togglePublish(i.id)}>{extras.published.includes(i.id) ? 'Unpublish' : 'Publish locally'}</button> {i.title}</p>
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
  return (
    <section className="page-content">
      <Intro eyebrow="SAMPLE DATA" title="Connections" detail="Fictional sample profiles. Requests are saved only in this browser and are not delivered to anyone." />
      <div className="panel filter-row"><label>Search by name, college, skill or interest<input value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
      {people.length === 0 && <p className="muted">No matches.</p>}
      {people.map((p) => (
        <article className="panel extra-item" key={p.id}>
          <h2>{p.name}</h2><p className="muted">{p.college} · {p.interest}</p><p>Goal: {p.goal}</p><p className="muted">Skills: {p.skills.join(', ')}</p>
          <button className="button button-secondary compact" type="button" onClick={() => set(`c:${p.id}`, extras.interest[`c:${p.id}`] ? undefined : 'Request sent')}>{extras.interest[`c:${p.id}`] ? 'Cancel request' : 'Connect'}</button>
        </article>
      ))}
      <div className="panel extra-item"><h2>Sent requests</h2>{sent.length ? sent.map((p) => <p key={p.id}>{p.name}: {extras.interest[`c:${p.id}`]} (local)</p>) : <p className="muted">None yet.</p>}</div>
      <div className="panel extra-item"><h2>Received (demo)</h2><p>Kabir (sample) would like to collaborate on a campus dashboard. <span className="muted">{extras.interest['r:p3'] ?? 'Pending'}</span></p>
        <button className="button button-secondary compact" type="button" onClick={() => set('r:p3', 'Accepted')}>Accept</button>{' '}
        <button className="button button-secondary compact" type="button" onClick={() => set('r:p3', 'Declined')}>Decline</button></div>
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
