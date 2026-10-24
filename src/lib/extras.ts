export interface Opportunity { id: string; title: string; description: string; domain: string; type: string; skills: string[]; by: string }
export interface Person { id: string; name: string; college: string; interest: string; goal: string; skills: string[] }
export interface Extras { interest: Record<string, string>; published: string[] }

export const PAGE_META: Record<string, { title: string; description: string }> = {
  overview: { title: 'Workspace', description: 'ORIGANO is a free browser tool that turns hackathon and event feedback into a dated action plan. No account needed.' },
  events: { title: 'Events', description: 'Create and manage the hackathons, competitions, conferences and workshops you attended.' },
  reflection: { title: 'Reflection', description: 'Answer guided questions about an event and turn takeaways into tasks.' },
  feedback: { title: 'Feedback to action', description: 'Paste judge or mentor feedback and get editable, rule-based suggested actions for your plan.' },
  actions: { title: 'Action plan', description: 'Track tasks, priorities and deadlines created from your feedback.' },
  ideas: { title: 'Idea vault', description: 'Capture and develop project ideas with problem, solution and next milestone.' },
  timeline: { title: '30-day timeline', description: 'A 24-hour, 7-day and 30-day follow-through timeline linked to your tasks.' },
  progress: { title: 'Progress', description: 'See completed, pending and overdue work calculated from your own data.' },
  opportunities: { title: 'Opportunities', description: 'Browse sample collaboration, mentorship and project opportunities. Interest stays in your browser.' },
  connections: { title: 'Connections', description: 'Browse fictional sample collaborator profiles and send local demo requests.' },
  organizer: { title: 'Organizer insights', description: 'Demo organizer view with clearly labelled sample insights.' },
  settings: { title: 'Data and settings', description: 'Export, import, reset or clear your workspace. Data stays in this browser.' },
  thanks: { title: 'Thank you', description: 'Your reflection was saved in this browser.' },
  notfound: { title: 'Page not found', description: 'This page does not exist in ORIGANO.' },
}

export const OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', title: 'Onboarding research buddy', description: 'Two people wanted to run five short user interviews on a student productivity app.', domain: 'Research', type: 'Collaboration', skills: ['Research', 'UX'], by: 'Demo team Atlas' },
  { id: 'o2', title: 'Mentor chat: pitching a prototype', description: 'A 20-minute session on structuring a three-minute pitch.', domain: 'Presentation', type: 'Mentorship', skills: ['Pitching'], by: 'Demo mentor (sample)' },
  { id: 'o3', title: 'Open-source dashboard contributors', description: 'Help with charts and accessibility fixes on a community dashboard.', domain: 'Web', type: 'Skill contribution', skills: ['React', 'Accessibility'], by: 'Demo team Fern' },
  { id: 'o4', title: 'Campus health-tech prototype', description: 'Student project needing a front-end builder to turn a design flow into a working prototype.', domain: 'Health', type: 'Project', skills: ['React', 'Design'], by: 'Demo team Basil' },
]
export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Aarav (sample)', college: 'Demo College A', interest: 'Education', goal: 'Ship a learning app prototype in 30 days.', skills: ['React', 'UI'] },
  { id: 'p2', name: 'Meera (sample)', college: 'Demo College B', interest: 'Health', goal: 'Validate a wellness idea with 10 interviews.', skills: ['Research', 'Writing'] },
  { id: 'p3', name: 'Kabir (sample)', college: 'Demo College A', interest: 'Climate', goal: 'Build a small campus energy dashboard.', skills: ['Python', 'Data'] },
]

const KEY = 'origano-extras-v1'
const empty = (): Extras => ({ interest: {}, published: [] })
export function loadExtras(): Extras {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (v && typeof v === 'object' && 'interest' in v && 'published' in v) return v as Extras
  } catch { /* fall back to empty */ }
  return empty()
}
export function saveExtras(extras: Extras): void {
  try { localStorage.setItem(KEY, JSON.stringify(extras)) } catch { /* storage unavailable */ }
}
