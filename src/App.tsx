import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  Activity, ArrowDownToLine, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  BarChart3, ChevronDown, CircleHelp, Handshake, Users, Clock3, Compass, FileUp, Flag, Home, Lightbulb, ListChecks, MessageSquareText,
  NotebookPen, Plus, RotateCcw, Settings2, Trash2, X,
} from 'lucide-react'
import './App.css'
import './theme.css'
import OrbitBackground from './components/OrbitBackground'
import Scene3D from './components/Scene3D'
import StorageNotice from './components/StorageNotice'
import { NotFoundPage, OpportunitiesPage, OrganizerPage, ConnectionsPage, ThanksPage } from './pages/Extras'
import { loadExtras, PAGE_META, saveExtras, type Extras } from './lib/extras'
import {
  createId, REFLECTION_QUESTIONS,
  type ActionTask, type EventRecord, type EventType, type FeedbackRecord, type FeedbackSuggestion,
  type IdeaRecord, type IdeaStatus, type Priority, type ReflectionRecord, type TaskStatus,
  type TimelineMilestone, type WorkspaceState,
} from './model'
import { analyzeFeedback } from './lib/feedback'
import {
  clearWorkspace, exportWorkspace, loadWorkspace, normalizeImportedWorkspace, resetWorkspace, saveWorkspace,
} from './lib/storage'

type Page = 'opportunities' | 'connections' | 'organizer' | 'thanks' | 'notfound' | 'overview' | 'events' | 'reflection' | 'feedback' | 'actions' | 'ideas' | 'timeline' | 'progress' | 'settings'

const NAV_ITEMS: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: 'overview', label: 'Workspace', icon: Home },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'reflection', label: 'Reflection', icon: NotebookPen },
  { id: 'feedback', label: 'Feedback to action', icon: MessageSquareText },
  { id: 'actions', label: 'Action plan', icon: ListChecks },
  { id: 'ideas', label: 'Idea vault', icon: Lightbulb },
  { id: 'timeline', label: '30-day timeline', icon: Clock3 },
  { id: 'progress', label: 'Progress', icon: Activity },
  { id: 'opportunities', label: 'Opportunities', icon: Handshake },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'organizer', label: 'Organizer insights', icon: BarChart3 },
  { id: 'settings', label: 'Data & settings', icon: Settings2 },
]

const KNOWN_PAGES: string[] = ['overview', 'events', 'reflection', 'feedback', 'actions', 'ideas', 'timeline', 'progress', 'opportunities', 'connections', 'organizer', 'settings', 'thanks']
function pageFromHash(): Page {
  const hash = window.location.hash.slice(1)
  if (!hash || hash === 'workspace') return 'overview'
  return KNOWN_PAGES.includes(hash) ? hash as Page : 'notfound'
}

const EVENT_TYPES: EventType[] = ['Hackathon', 'Competition', 'Conference', 'Workshop', 'Networking', 'Other']

const newEventForm = (): Omit<EventRecord, 'id' | 'createdAt'> => ({
  name: '',
  type: 'Hackathon',
  date: todayString(),
  description: '',
  role: '',
  outcome: '',
  notes: '',
})

const newTaskForm = (eventId = ''): Omit<ActionTask, 'id' | 'createdAt' | 'updatedAt'> => ({
  eventId,
  feedbackId: undefined,
  ideaId: undefined,
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
})

const newIdeaForm = (eventId = ''): Omit<IdeaRecord, 'id' | 'createdAt' | 'updatedAt'> => ({
  eventId,
  title: '',
  problem: '',
  solution: '',
  domain: '',
  skills: '',
  notes: '',
  nextMilestone: '',
  status: 'raw',
})

const newFeedbackForm = () => ({ id: '', eventId: '', source: 'Judge', text: '' })
const formatDate = (value: string) => value
  ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
  : 'No date'
const formatTimestamp = (value: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const todayString = () => new Date().toISOString().slice(0, 10)
const nowIso = () => new Date().toISOString()
const isOverdue = (date: string, status?: TaskStatus) => Boolean(date && date < todayString() && status !== 'done')

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(loadWorkspace)
  const [page, setPageState] = useState<Page>(pageFromHash)
  const [extras, setExtras] = useState<Extras>(loadExtras)
  const [menuOpen, setMenuOpen] = useState(false)
  const setPage = (next: Page) => {
    setPageState(next)
    setMenuOpen(false)
    try { window.history.replaceState(null, '', `#${next}`) } catch { /* sandboxed */ }
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    const onHash = () => setPageState(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => { saveExtras(extras) }, [extras])
  useEffect(() => {
    const meta = PAGE_META[page]
    document.title = `${meta.title} – ORIGANO`
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
  }, [page])
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState('')
  const [eventForm, setEventForm] = useState(newEventForm())
  const [editingEventId, setEditingEventId] = useState('')
  const [eventQuery, setEventQuery] = useState('')
  const [taskForm, setTaskForm] = useState(newTaskForm)
  const [editingTaskId, setEditingTaskId] = useState('')
  const [taskQuery, setTaskQuery] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all')
  const [taskSort, setTaskSort] = useState<'date' | 'priority' | 'created'>('date')
  const [feedbackForm, setFeedbackForm] = useState(newFeedbackForm)
  const [feedbackSuggestions, setFeedbackSuggestions] = useState<FeedbackSuggestion[]>([])
  const [feedbackQuery, setFeedbackQuery] = useState('')
  const [ideaForm, setIdeaForm] = useState(newIdeaForm)
  const [editingIdeaId, setEditingIdeaId] = useState('')
  const [ideaQuery, setIdeaQuery] = useState('')
  const [ideaStatusFilter, setIdeaStatusFilter] = useState('all')
  const [reflectionQuestion, setReflectionQuestion] = useState(0)
  const [reflectionEventId, setReflectionEventId] = useState(() => workspace.currentEventId)
  const [reflectionDraft, setReflectionDraft] = useState<Record<string, string>>(
    () => workspace.reflections.find((reflection) => reflection.eventId === workspace.currentEventId)?.answers ?? {},
  )
  const [importMessage, setImportMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const noticeTimeoutRef = useRef<number | undefined>(undefined)

  const currentEvent = workspace.events.find((event) => event.id === workspace.currentEventId)
  const activeEventId = currentEvent?.id ?? ''
  const activeEventName = currentEvent?.name ?? 'Choose an event to get started'

  useEffect(() => {
    try {
      saveWorkspace(workspace)
      setStorageError('')
    } catch (error) {
      console.error('Could not save the ORIGANO workspace to browser storage.', error)
      setStorageError('Browser storage is unavailable or full. Export your workspace before continuing.')
    }
  }, [workspace])

  const eventName = (eventId: string) => workspace.events.find((event) => event.id === eventId)?.name ?? 'Unassigned event'
  const selectedEventId = activeEventId || workspace.events[0]?.id || ''
  const resolveEventId = (eventId: string) => workspace.events.some((event) => event.id === eventId)
    ? eventId
    : activeEventId

  const visibleTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase()
    return workspace.tasks
      .filter((task) => !query || `${task.title} ${task.description} ${workspace.events.find((event) => event.id === task.eventId)?.name ?? ''}`.toLowerCase().includes(query))
      .filter((task) => taskStatusFilter === 'all' || task.status === taskStatusFilter)
      .filter((task) => taskPriorityFilter === 'all' || task.priority === taskPriorityFilter)
      .sort((a, b) => {
        if (taskSort === 'priority') {
          const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
          return rank[a.priority] - rank[b.priority]
        }
        if (taskSort === 'created') return b.createdAt.localeCompare(a.createdAt)
        return (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
      })
  }, [workspace.events, workspace.tasks, taskQuery, taskStatusFilter, taskPriorityFilter, taskSort])
  const visibleIdeas = workspace.ideas
    .filter((idea) => !ideaQuery || `${idea.title} ${idea.problem} ${idea.domain}`.toLowerCase().includes(ideaQuery.toLowerCase()))
    .filter((idea) => ideaStatusFilter === 'all' || idea.status === ideaStatusFilter)
  const visibleFeedback = workspace.feedback.filter((item) =>
    !feedbackQuery || `${item.source} ${item.text} ${item.suggestions.map((suggestion) => suggestion.title).join(' ')}`.toLowerCase().includes(feedbackQuery.toLowerCase()),
  )
  const activeTasks = workspace.tasks.filter((task) => task.status !== 'done')
  const overdueTasks = activeTasks.filter((task) => isOverdue(task.dueDate, task.status))
  const doneTasks = workspace.tasks.filter((task) => task.status === 'done')
  const activeIdeas = workspace.ideas.filter((idea) => !['paused', 'completed'].includes(idea.status))
  const completedMilestones = workspace.milestones.filter((milestone) => milestone.completedAt)
  const feedbackReviewed = workspace.feedback.reduce((count, item) => count + item.suggestions.filter((suggestion) => suggestion.acceptedTaskId || suggestion.dismissed).length, 0)
  const taskCompletion = workspace.tasks.length ? Math.round(doneTasks.length / workspace.tasks.length * 100) : 0
  const timelineCompletion = workspace.milestones.length ? Math.round(completedMilestones.length / workspace.milestones.length * 100) : 0

  function announce(message: string) {
    setNotice(message)
    if (noticeTimeoutRef.current) window.clearTimeout(noticeTimeoutRef.current)
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(''), 3600)
  }

  function selectReflectionEvent(eventId: string) {
    setReflectionEventId(eventId)
    setReflectionDraft(workspace.reflections.find((reflection) => reflection.eventId === eventId)?.answers ?? {})
  }

  function logActivity(title: string, detail: string, eventId = activeEventId) {
    setWorkspace((state) => ({
      ...state,
      activity: [{ id: createId('activity'), eventId: eventId || undefined, title, detail, createdAt: nowIso() }, ...state.activity].slice(0, 40),
    }))
  }

  function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!eventForm.name.trim()) return
    const eventId = editingEventId || createId('event')
    const record: EventRecord = {
      ...eventForm,
      name: eventForm.name.trim(),
      id: eventId,
      createdAt: workspace.events.find((item) => item.id === eventId)?.createdAt ?? nowIso(),
    }
    setWorkspace((state) => ({
      ...state,
      events: editingEventId
        ? state.events.map((item) => item.id === eventId ? record : item)
        : [record, ...state.events],
      currentEventId: state.currentEventId || eventId,
    }))
    setEditingEventId('')
    setEventForm(newEventForm())
    announce(editingEventId ? 'Event updated.' : 'Event created.')
    logActivity(editingEventId ? 'Event updated' : 'Event created', record.name, eventId)
  }

  function editEvent(event: EventRecord) {
    setEditingEventId(event.id)
    setEventForm({
      name: event.name, type: event.type, date: event.date, description: event.description,
      role: event.role, outcome: event.outcome, notes: event.notes,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteEvent(event: EventRecord) {
    const linkedCount = workspace.feedback.filter((item) => item.eventId === event.id).length
      + workspace.tasks.filter((item) => item.eventId === event.id).length
      + workspace.ideas.filter((item) => item.eventId === event.id).length
      + workspace.reflections.filter((item) => item.eventId === event.id).length
      + workspace.milestones.filter((item) => item.eventId === event.id).length
    if (!window.confirm(`Delete “${event.name}”? Its event notes and details will be removed. ${linkedCount} linked records will be kept but marked as unassigned.`)) return
    setWorkspace((state) => {
      const events = state.events.filter((item) => item.id !== event.id)
      return {
        ...state,
        events,
        currentEventId: state.currentEventId === event.id ? events[0]?.id ?? '' : state.currentEventId,
        feedback: state.feedback.map((item) => item.eventId === event.id ? { ...item, eventId: '' } : item),
        tasks: state.tasks.map((item) => item.eventId === event.id ? { ...item, eventId: '' } : item),
        ideas: state.ideas.map((item) => item.eventId === event.id ? { ...item, eventId: '' } : item),
        reflections: state.reflections.map((item) => item.eventId === event.id ? { ...item, eventId: '' } : item),
        milestones: state.milestones.map((item) => item.eventId === event.id ? { ...item, eventId: '' } : item),
      }
    })
    if (reflectionEventId === event.id) {
      const replacementId = workspace.events.find((item) => item.id !== event.id)?.id ?? ''
      setReflectionEventId(replacementId)
      setReflectionDraft(workspace.reflections.find((item) => item.eventId === replacementId)?.answers ?? {})
    }
    logActivity('Event deleted', event.name, '')
    announce('Event removed. Its linked records were preserved.')
  }

  function startFeedbackAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!feedbackForm.text.trim() || !resolveEventId(feedbackForm.eventId)) return
    setFeedbackSuggestions(analyzeFeedback(feedbackForm.text.trim()).suggestions)
  }

  function saveFeedback() {
    const relatedEventId = resolveEventId(feedbackForm.eventId)
    if (!feedbackForm.text.trim() || !relatedEventId || feedbackSuggestions.length === 0) return
    const id = feedbackForm.id || createId('feedback')
    const record: FeedbackRecord = {
      id,
      eventId: relatedEventId,
      source: feedbackForm.source.trim() || 'Personal observation',
      text: feedbackForm.text.trim(),
      createdAt: workspace.feedback.find((item) => item.id === id)?.createdAt ?? nowIso(),
      suggestions: feedbackSuggestions,
    }
    setWorkspace((state) => ({
      ...state,
      feedback: feedbackForm.id
        ? state.feedback.map((item) => item.id === id ? record : item)
        : [record, ...state.feedback],
    }))
    setFeedbackForm(newFeedbackForm())
    setFeedbackSuggestions([])
    announce(feedbackForm.id ? 'Feedback updated.' : 'Feedback and suggested actions saved.')
    logActivity(feedbackForm.id ? 'Feedback updated' : 'Feedback captured', record.source, record.eventId)
  }

  function editFeedback(item: FeedbackRecord) {
    setFeedbackForm({ id: item.id, eventId: item.eventId, source: item.source, text: item.text })
    setFeedbackSuggestions(item.suggestions.map((suggestion) => ({ ...suggestion })))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function deleteFeedback(item: FeedbackRecord) {
    if (!window.confirm('Delete this feedback item? Existing tasks created from it will be kept.')) return
    setWorkspace((state) => ({
      ...state,
      feedback: state.feedback.filter((entry) => entry.id !== item.id),
      tasks: state.tasks.map((task) => task.feedbackId === item.id ? { ...task, feedbackId: undefined } : task),
    }))
    logActivity('Feedback deleted', item.source, item.eventId)
    announce('Feedback removed. Existing action-plan tasks were kept.')
  }

  function acceptSuggestion(feedback: FeedbackRecord, suggestion: FeedbackSuggestion) {
    if (suggestion.acceptedTaskId) {
      setPage('actions')
      return
    }
    const id = createId('task')
    const newTask: ActionTask = {
      id,
      eventId: feedback.eventId,
      feedbackId: feedback.id,
      title: suggestion.title.trim(),
      description: suggestion.description.trim(),
      status: 'todo',
      priority: suggestion.priority,
      dueDate: suggestion.dueDate,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    if (!newTask.title) return
    setWorkspace((state) => ({
      ...state,
      tasks: [newTask, ...state.tasks],
      feedback: state.feedback.map((item) => item.id === feedback.id
        ? { ...item, suggestions: item.suggestions.map((candidate) => candidate.id === suggestion.id ? { ...candidate, acceptedTaskId: id } : candidate) }
        : item),
      activity: [{ id: createId('activity'), eventId: feedback.eventId || undefined, title: 'Action added from feedback', detail: newTask.title, createdAt: nowIso() }, ...state.activity].slice(0, 40),
    }))
    announce('Added to your action plan.')
  }

  function updateSuggestion(feedbackId: string, suggestionId: string, changes: Partial<FeedbackSuggestion>) {
    setWorkspace((state) => ({
      ...state,
      feedback: state.feedback.map((item) => item.id === feedbackId
        ? { ...item, suggestions: item.suggestions.map((suggestion) => suggestion.id === suggestionId ? { ...suggestion, ...changes } : suggestion) }
        : item),
    }))
  }

  function updatePreviewSuggestion(suggestionId: string, changes: Partial<FeedbackSuggestion>) {
    setFeedbackSuggestions((suggestions) => suggestions.map((item) => item.id === suggestionId ? { ...item, ...changes } : item))
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!taskForm.title.trim()) return
    const id = editingTaskId || createId('task')
    const oldTask = workspace.tasks.find((item) => item.id === id)
    const task: ActionTask = {
      ...taskForm,
      eventId: resolveEventId(taskForm.eventId) || selectedEventId,
      title: taskForm.title.trim(),
      id,
      createdAt: oldTask?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    setWorkspace((state) => ({
      ...state,
      tasks: editingTaskId ? state.tasks.map((item) => item.id === id ? task : item) : [task, ...state.tasks],
    }))
    setTaskForm(newTaskForm())
    setEditingTaskId('')
    announce(editingTaskId ? 'Action updated.' : 'Action added.')
    logActivity(editingTaskId ? 'Action updated' : 'Action added', task.title, task.eventId)
  }

  function editTask(task: ActionTask) {
    setEditingTaskId(task.id)
    setTaskForm({
      eventId: task.eventId, feedbackId: task.feedbackId, ideaId: task.ideaId, title: task.title,
      description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateTask(id: string, changes: Partial<ActionTask>) {
    const task = workspace.tasks.find((item) => item.id === id)
    setWorkspace((state) => ({
      ...state,
      tasks: state.tasks.map((task) => task.id === id ? { ...task, ...changes, updatedAt: nowIso() } : task),
    }))
    if (changes.status && task) {
      logActivity(changes.status === 'done' ? 'Action completed' : 'Action status updated', task.title, task.eventId)
    }
  }

  function deleteTask(task: ActionTask) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    setWorkspace((state) => ({
      ...state,
      tasks: state.tasks.filter((item) => item.id !== task.id),
      feedback: state.feedback.map((item) => ({
        ...item,
        suggestions: item.suggestions.map((suggestion) => suggestion.acceptedTaskId === task.id ? { ...suggestion, acceptedTaskId: undefined } : suggestion),
      })),
    }))
    logActivity('Action deleted', task.title, task.eventId)
  }

  function saveReflectionDraft() {
    if (!reflectionEventId) return
    const existing = workspace.reflections.find((item) => item.eventId === reflectionEventId)
    const entry: ReflectionRecord = {
      id: existing?.id ?? createId('reflection'),
      eventId: reflectionEventId,
      answers: reflectionDraft,
      updatedAt: nowIso(),
      submittedAt: existing?.submittedAt,
    }
    setWorkspace((state) => ({
      ...state,
      reflections: existing
        ? state.reflections.map((item) => item.id === existing.id ? entry : item)
        : [entry, ...state.reflections],
    }))
    logActivity('Reflection draft saved', `${Object.values(reflectionDraft).filter((answer) => answer.trim()).length} response(s) saved`, reflectionEventId)
    announce('Reflection draft saved in this browser.')
  }

  function submitReflection() {
    if (!reflectionEventId || !Object.values(reflectionDraft).some((answer) => answer.trim())) return
    const existing = workspace.reflections.find((item) => item.eventId === reflectionEventId)
    const entry: ReflectionRecord = {
      id: existing?.id ?? createId('reflection'),
      eventId: reflectionEventId,
      answers: reflectionDraft,
      updatedAt: nowIso(),
      submittedAt: nowIso(),
    }
    setWorkspace((state) => ({
      ...state,
      reflections: existing
        ? state.reflections.map((item) => item.id === existing.id ? entry : item)
        : [entry, ...state.reflections],
    }))
    logActivity('Reflection saved', `${Object.values(reflectionDraft).filter((answer) => answer.trim()).length} response(s) saved`, reflectionEventId)
    announce('Reflection saved.')
    setPage('thanks')
  }

  function deleteReflection(reflection: ReflectionRecord) {
    if (!window.confirm('Delete this reflection?')) return
    setWorkspace((state) => ({ ...state, reflections: state.reflections.filter((item) => item.id !== reflection.id) }))
    if (reflection.eventId === reflectionEventId) setReflectionDraft({})
    logActivity('Reflection deleted', eventName(reflection.eventId), reflection.eventId)
  }

  function reflectionToTask(question: string) {
    const text = reflectionDraft[question]?.trim()
    if (!text || !reflectionEventId) return
    const title = text.length > 54 ? `${text.slice(0, 51)}…` : text
    const task: ActionTask = {
      id: createId('task'),
      eventId: reflectionEventId,
      title,
      description: `Follow-up from reflection: ${question}`,
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    setWorkspace((state) => ({ ...state, tasks: [task, ...state.tasks] }))
    logActivity('Reflection converted to an action', task.title, reflectionEventId)
    announce('Reflection takeaway added to the action plan.')
  }

  function createIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ideaForm.title.trim()) return
    const id = editingIdeaId || createId('idea')
    const oldIdea = workspace.ideas.find((item) => item.id === id)
    const idea: IdeaRecord = {
      ...ideaForm,
      eventId: resolveEventId(ideaForm.eventId) || selectedEventId,
      title: ideaForm.title.trim(),
      id,
      createdAt: oldIdea?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    setWorkspace((state) => ({
      ...state,
      ideas: editingIdeaId ? state.ideas.map((item) => item.id === id ? idea : item) : [idea, ...state.ideas],
    }))
    setIdeaForm(newIdeaForm())
    setEditingIdeaId('')
    announce(editingIdeaId ? 'Idea updated.' : 'Idea captured.')
    logActivity(editingIdeaId ? 'Idea updated' : 'Idea captured', idea.title, idea.eventId)
  }

  function editIdea(idea: IdeaRecord) {
    setEditingIdeaId(idea.id)
    setIdeaForm({
      eventId: idea.eventId, title: idea.title, problem: idea.problem, solution: idea.solution,
      domain: idea.domain, skills: idea.skills, notes: idea.notes, nextMilestone: idea.nextMilestone, status: idea.status,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateIdea(id: string, changes: Partial<IdeaRecord>) {
    const idea = workspace.ideas.find((item) => item.id === id)
    setWorkspace((state) => ({
      ...state,
      ideas: state.ideas.map((idea) => idea.id === id ? { ...idea, ...changes, updatedAt: nowIso() } : idea),
    }))
    if (changes.status && idea && changes.status !== idea.status) {
      logActivity('Idea stage changed', `${idea.title} · ${changes.status}`, idea.eventId)
    }
  }

  function deleteIdea(idea: IdeaRecord) {
    if (!window.confirm(`Delete “${idea.title}”? Linked tasks will remain in your action plan.`)) return
    setWorkspace((state) => ({
      ...state,
      ideas: state.ideas.filter((item) => item.id !== idea.id),
      tasks: state.tasks.map((task) => task.ideaId === idea.id ? { ...task, ideaId: undefined } : task),
    }))
    logActivity('Idea deleted', idea.title, idea.eventId)
  }

  function updateMilestone(milestone: TimelineMilestone, changes: Partial<TimelineMilestone>) {
    setWorkspace((state) => ({
      ...state,
      milestones: state.milestones.map((item) => item.id === milestone.id ? { ...item, ...changes } : item),
    }))
    if (Object.prototype.hasOwnProperty.call(changes, 'completedAt')) {
      logActivity(changes.completedAt ? 'Milestone completed' : 'Milestone reopened', milestone.title, milestone.eventId)
    }
  }

  function convertMilestone(milestone: TimelineMilestone) {
    const task: ActionTask = {
      id: createId('task'),
      eventId: milestone.eventId,
      title: milestone.title,
      description: milestone.description,
      status: 'todo',
      priority: 'medium',
      dueDate: milestone.dueDate,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    setWorkspace((state) => ({ ...state, tasks: [task, ...state.tasks] }))
    logActivity('Milestone added to action plan', task.title, task.eventId)
    announce('Milestone added to your action plan.')
  }

  function handleImport(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onerror = () => setImportMessage('Could not read that file. Please try again.')
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        const imported = normalizeImportedWorkspace(parsed)
        setWorkspace(imported)
        setImportMessage(`Imported ${imported.events.length} event(s), ${imported.tasks.length} action(s), and ${imported.ideas.length} idea(s).`)
      } catch (error) {
        setImportMessage(error instanceof Error ? error.message : 'Import failed. Select a valid ORIGANO JSON export.')
      }
    }
    reader.readAsText(file)
  }

  function loadSamples() {
    if (!window.confirm('Replace the current browser workspace with the sample project? Export first if you want to keep your records.')) return
    setWorkspace(resetWorkspace())
    setImportMessage('')
    announce('Sample workspace restored.')
  }

  function clearData() {
    if (!window.confirm('Clear all ORIGANO data saved in this browser? This cannot be undone unless you exported a copy.')) return
    setWorkspace(clearWorkspace())
    setImportMessage('')
    announce('Browser workspace cleared.')
  }

  function eventSelect(value: string, onChange: (eventId: string) => void, id: string, label: string) {
    const eventIds = new Set(workspace.events.map((event) => event.id))
    const selectedEventId = value && eventIds.has(value) ? value : eventIds.has(activeEventId) ? activeEventId : ''
    return (
      <label className="field">
        <span>{label}</span>
        <select id={id} value={selectedEventId} onChange={(event) => onChange(event.target.value)}>
          <option value="">Unassigned</option>
          {workspace.events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
    )
  }

  function pageTitle() {
    return NAV_ITEMS.find((item) => item.id === page)?.label ?? PAGE_META[page].title
  }

  return (
    <div className="app-shell">
      <OrbitBackground />
      <aside className="sidebar">
        <a className="brand" href="#workspace" aria-label="ORIGANO workspace" onClick={(event) => { event.preventDefault(); setPage('overview') }}>
          <span className="brand-symbol">o</span>
          <span>ORIGANO<small>AFTER THE EVENT</small></span>
        </a>
        <div className="event-switcher">
          <span className="overline">CURRENT EVENT</span>
          <select
            aria-label="Select current event"
            value={activeEventId}
            onChange={(event) => setWorkspace((state) => ({ ...state, currentEventId: event.target.value }))}
          >
            <option value="">No event selected</option>
            {workspace.events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
          <button className="quiet-button" onClick={() => { setPage('events'); setEditingEventId(''); setEventForm(newEventForm()) }} type="button">
            <Plus size={14} /> New event
          </button>
        </div>
        <nav className="side-nav" aria-label="Workspace navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-link ${page === id ? 'selected' : ''}`}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => setPage(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {id === 'actions' && activeTasks.length > 0 && <span className="nav-count">{activeTasks.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>Private by default.<br />Stored in this browser.</p>
          <button className="quiet-button" type="button" onClick={() => setPage('settings')}><CircleHelp size={15} /> Data & privacy</button>
        </div>
      </aside>

      <main className="main-area" id="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-symbol">o</span> ORIGANO</div>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{pageTitle()}</strong></div>
          <div className="topbar-right">
            <span className="local-indicator"><i /> Saved in this browser</span>
            <button className="icon-button" aria-label="Open data and settings" title="Data and settings" onClick={() => setPage('settings')} type="button"><Settings2 size={18} /></button>
          </div>
        </header>
        <div className="mobile-nav menu-nav" onKeyDown={(event) => { if (event.key === 'Escape') setMenuOpen(false) }}>
          <button type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="page-menu" onClick={() => setMenuOpen((open) => !open)}>{pageTitle()}<ChevronDown size={16} /></button>
          {menuOpen && <div id="page-menu" className="menu-list">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}><Icon size={16} />{label}</button>
            ))}
          </div>}
        </div>

        <div className="content-area">
          <StorageNotice />
          {storageError && <div className="error-banner" role="alert">{storageError}</div>}
          {page === 'overview' && (
            <section className="page-content">
              <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                  <p className="eyebrow">FOR PEOPLE WHO JUST FINISHED A HACKATHON, COMPETITION OR WORKSHOP</p>
                  <h1 id="hero-title">Turn event feedback into a dated action plan.</h1>
                  <p className="intro-copy">ORIGANO is a free tool that runs in your browser. Paste what judges and mentors told you and it suggests concrete tasks with deadlines. Feedback that is not planned is forgotten within days, and follow-through is where progress happens.{currentEvent ? ` Current event: ${activeEventName}.` : ''}</p>
                  <div className="hero-actions">
                    <button className="button button-cta" type="button" onClick={() => setPage('feedback')}>Paste your feedback <ArrowRight size={18} /></button>
                    <button className="button button-secondary" type="button" onClick={() => { setPage('events'); setEditingEventId(''); setEventForm(newEventForm()) }}><Plus size={16} /> Create event</button>
                  </div>
                  <ol className="hero-steps"><li>Paste feedback</li><li>Review suggested actions</li><li>Track progress</li></ol>
                  <p className="muted">No account. Your data stays in this browser. The event ends. Your next chapter begins.</p>
                </div>
                <Scene3D />
              </section>
              <div className="workspace-grid">
                <div className="overview-main">
                  <div className="metric-grid">
                    <Metric label="To follow through" value={activeTasks.length} detail={`${overdueTasks.length} overdue`} icon={<ListChecks size={18} />} />
                    <Metric label="Completed" value={doneTasks.length} detail={`${taskCompletion}% of all actions`} icon={<CheckCircle2 size={18} />} />
                    <Metric label="Feedback captured" value={workspace.feedback.length} detail={`${feedbackReviewed} suggestions reviewed`} icon={<MessageSquareText size={18} />} />
                    <Metric label="Ideas in motion" value={activeIdeas.length} detail={`${workspace.ideas.length} in the vault`} icon={<Lightbulb size={18} />} />
                  </div>
                  <div className="panel followup-panel">
                    <PanelTitle eyebrow="THE SIGNATURE WORKFLOW" title="Turn feedback into a plan" action={<button className="text-button" type="button" onClick={() => setPage('feedback')}>Open feedback analyzer <ArrowRight size={15} /></button>} />
                    {workspace.feedback.length ? (
                      <div className="feedback-preview-list">
                        {workspace.feedback.slice(0, 2).map((item) => (
                          <article className="feedback-preview" key={item.id}>
                            <div className="feedback-preview-top"><span className="source-label">{item.source} · {eventName(item.eventId)}</span><span>{formatDate(item.createdAt.slice(0, 10))}</span></div>
                            <p>“{item.text}”</p>
                            <div className="category-row">
                              {[...new Set(item.suggestions.map((suggestion) => suggestion.category))].map((category) => <span className="category-tag" key={category}>{category}</span>)}
                              <button className="inline-link" type="button" onClick={() => { setPage('feedback'); editFeedback(item) }}>Review suggestions <ArrowRight size={14} /></button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : <EmptyState title="No feedback yet" detail="Add a judge comment, mentor note, or personal observation to generate practical next steps." action={<button className="button button-primary" type="button" onClick={() => setPage('feedback')}>Add feedback</button>} />}
                  </div>
                  <div className="panel">
                    <PanelTitle eyebrow="YOUR NEXT MOVES" title="Action plan" action={<button className="text-button" type="button" onClick={() => setPage('actions')}>See all actions <ArrowRight size={15} /></button>} />
                    {activeTasks.length ? <div className="task-preview-list">
                      {activeTasks.slice(0, 4).map((task) => <TaskRow key={task.id} task={task} eventName={eventName(task.eventId)} ideaTitle={task.ideaId ? workspace.ideas.find((idea) => idea.id === task.ideaId)?.title : undefined} onToggle={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} onOpen={() => { setPage('actions'); editTask(task) }} />)}
                    </div> : <EmptyState title="Your plan starts here" detail="Capture feedback or create an action to begin building momentum." action={<button className="button button-secondary" type="button" onClick={() => setPage('actions')}>Create an action</button>} />}
                  </div>
                </div>
                <aside className="overview-aside">
                  <JourneyVisual onSelect={setPage} />
                  <div className="panel next-panel">
                    <PanelTitle eyebrow="A USEFUL RHYTHM" title="The next 30 days" action={<button className="text-button" type="button" onClick={() => setPage('timeline')}>View timeline <ArrowRight size={15} /></button>} />
                    <div className="mini-timeline">
                      {workspace.milestones.slice(0, 3).map((milestone) => <div key={milestone.id} className="mini-milestone">
                        <i className={milestone.completedAt ? 'complete' : ''} />
                        <div><span>{milestone.window === '24h' ? 'FIRST 24 HOURS' : milestone.window === '7d' ? 'FIRST 7 DAYS' : 'FIRST 30 DAYS'}</span><strong>{milestone.title}</strong><small>{formatDate(milestone.dueDate)}</small></div>
                      </div>)}
                      {!workspace.milestones.length && <p className="muted">Add a milestone to map your next month.</p>}
                    </div>
                  </div>
                  <div className="panel activity-panel">
                    <PanelTitle eyebrow="RECENTLY" title="Activity" />
                    {workspace.activity.length ? <div className="activity-list">{workspace.activity.slice(0, 5).map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.title}</strong><p>{item.detail}</p><small>{formatDate(item.createdAt.slice(0, 10))}</small></div></div>)}</div> : <p className="muted">Updates to your workspace will appear here.</p>}
                  </div>
                </aside>
              </div>
              <Footer />
            </section>
          )}

          {page === 'events' && (
            <section className="page-content">
              <PageIntro eyebrow="YOUR EVENT CONTEXT" title="Event workspace" detail="Keep each event, its feedback, reflections, and follow-through together." />
              <div className="event-layout">
                <form className="panel form-panel" onSubmit={createEvent}>
                  <PanelTitle eyebrow={editingEventId ? 'UPDATE DETAILS' : 'START A NEW THREAD'} title={editingEventId ? 'Edit event' : 'Create an event'} />
                  <div className="form-grid">
                    <Field label="Event name" id="event-name"><input id="event-name" required value={eventForm.name} placeholder="e.g. Campus innovation weekend" onChange={(event) => setEventForm({ ...eventForm, name: event.target.value })} /></Field>
                    <Field label="Event type" id="event-type"><select id="event-type" value={eventForm.type} onChange={(event) => setEventForm({ ...eventForm, type: event.target.value as EventType })}>{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
                    <Field label="Date" id="event-date"><input id="event-date" type="date" value={eventForm.date} onChange={(event) => setEventForm({ ...eventForm, date: event.target.value })} /></Field>
                    <Field label="Your role" id="event-role"><input id="event-role" value={eventForm.role} placeholder="e.g. Designer, participant" onChange={(event) => setEventForm({ ...eventForm, role: event.target.value })} /></Field>
                    <Field label="Outcome" id="event-outcome"><input id="event-outcome" value={eventForm.outcome} placeholder="Optional" onChange={(event) => setEventForm({ ...eventForm, outcome: event.target.value })} /></Field>
                    <Field label="Short description" id="event-description" wide><textarea id="event-description" rows={3} value={eventForm.description} placeholder="What was the event about?" onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} /></Field>
                    <Field label="Notes" id="event-notes" wide><textarea id="event-notes" rows={3} value={eventForm.notes} placeholder="Anything you want to remember..." onChange={(event) => setEventForm({ ...eventForm, notes: event.target.value })} /></Field>
                  </div>
                  <div className="form-actions">
                    <button className="button button-primary" type="submit">{editingEventId ? 'Save event' : 'Create event'} <ArrowRight size={15} /></button>
                    {editingEventId && <button className="button button-secondary" type="button" onClick={() => { setEditingEventId(''); setEventForm(newEventForm()) }}>Cancel</button>}
                  </div>
                </form>
                <div className="event-list-column">
                  <div className="panel">
                    <PanelTitle eyebrow={`${workspace.events.length} SAVED`} title="Your events" />
                    <SearchField label="Search events" value={eventQuery} onChange={setEventQuery} placeholder="Find an event..." />
                    <div className="event-list">
                      {workspace.events.filter((event) => `${event.name} ${event.type} ${event.description}`.toLowerCase().includes(eventQuery.toLowerCase())).map((event) => (
                        <article className={`event-card ${event.id === activeEventId ? 'is-current' : ''}`} key={event.id}>
                          <div className="event-card-heading"><span className="event-type">{event.type}</span>{event.id === activeEventId && <span className="current-label"><Check size={12} /> CURRENT</span>}</div>
                          <h3>{event.name}</h3><p className="event-date">{formatDate(event.date)}{event.role ? ` · ${event.role}` : ''}</p>
                          {event.description && <p>{event.description}</p>}
                          <div className="event-card-actions">
                            <button className="button button-secondary compact" type="button" onClick={() => setWorkspace((state) => ({ ...state, currentEventId: event.id }))}>{event.id === activeEventId ? 'Selected' : 'Select event'}</button>
                            <button className="icon-button" type="button" aria-label={`Edit ${event.name}`} onClick={() => editEvent(event)}><NotebookPen size={15} /></button>
                            <button className="icon-button danger-icon" type="button" aria-label={`Delete ${event.name}`} onClick={() => deleteEvent(event)}><Trash2 size={15} /></button>
                          </div>
                          <div className="event-record-counts"><span>{workspace.feedback.filter((item) => item.eventId === event.id).length} feedback</span><span>{workspace.tasks.filter((item) => item.eventId === event.id).length} actions</span><span>{workspace.ideas.filter((item) => item.eventId === event.id).length} ideas</span></div>
                        </article>
                      ))}
                      {!workspace.events.length && <EmptyState title="No events yet" detail="Create an event to keep your reflection and action plan connected to the right experience." />}
                      {workspace.events.length > 0 && !workspace.events.some((event) => `${event.name} ${event.type} ${event.description}`.toLowerCase().includes(eventQuery.toLowerCase())) && <EmptyState title="No events found" detail="Try a different search." />}
                    </div>
                  </div>
                </div>
              </div>
              <Footer />
            </section>
          )}

          {page === 'feedback' && (
            <section className="page-content">
              <PageIntro eyebrow="THE SIGNATURE WORKFLOW" title="Feedback, made actionable." detail="Add a comment, see how ORIGANO categorizes it, then edit and accept the suggestions that make sense." />
              {!workspace.events.length && <div className="callout"><strong>First, create an event.</strong><span>Feedback and actions are connected to an event so their context stays intact.</span><button className="button button-secondary compact" type="button" onClick={() => setPage('events')}>Create event</button></div>}
              <div className="workflow-grid">
                <form className="panel form-panel" onSubmit={startFeedbackAnalysis}>
                  <PanelTitle eyebrow={feedbackForm.id ? 'EDIT FEEDBACK' : 'STEP 1 · CAPTURE'} title={feedbackForm.id ? 'Update the source note' : 'What did you hear?'} />
                  <div className="form-grid one-column">
                    {eventSelect(feedbackForm.eventId, (eventId) => setFeedbackForm({ ...feedbackForm, eventId }), 'feedback-event', 'Related event')}
                    <Field label="Source" id="feedback-source"><select id="feedback-source" value={feedbackForm.source} onChange={(event) => setFeedbackForm({ ...feedbackForm, source: event.target.value })}><option>Judge</option><option>Mentor</option><option>Teammate</option><option>Audience</option><option>Personal observation</option></select></Field>
                    <Field label="Feedback or observation" id="feedback-text" hint="A sentence or two is enough. This organizer uses deterministic keyword rules in your browser."><textarea id="feedback-text" required rows={7} value={feedbackForm.text} placeholder="Paste a judge comment, mentor note, or your own observation..." onChange={(event) => { setFeedbackForm({ ...feedbackForm, text: event.target.value }); setFeedbackSuggestions([]) }} /></Field>
                  </div>
                  <div className="form-actions">
                    <button className="button button-primary" disabled={!workspace.events.length || !feedbackForm.text.trim() || !(feedbackForm.eventId || activeEventId)} type="submit"><Compass size={16} /> Organize feedback</button>
                    {feedbackForm.id && <button className="button button-secondary" type="button" onClick={() => { setFeedbackForm(newFeedbackForm()); setFeedbackSuggestions([]) }}>Cancel edit</button>}
                  </div>
                  <p className="form-note">No AI service or server is involved. Feedback stays in this browser.</p>
                </form>
                <div className="panel suggestion-panel">
                  <PanelTitle eyebrow="STEP 2 · REVIEW" title={feedbackSuggestions.length ? 'Suggested improvements' : 'Your plan takes shape here'} />
                  {feedbackSuggestions.length ? (
                    <>
                      <p className="muted">Rule-based suggestions — editable before they become tasks.</p>
                      <div className="suggestion-list">
                        {feedbackSuggestions.map((suggestion) => <SuggestionEditor key={suggestion.id} suggestion={suggestion} onChange={(changes) => updatePreviewSuggestion(suggestion.id, changes)} onRemove={() => setFeedbackSuggestions((items) => items.filter((item) => item.id !== suggestion.id))} />)}
                      </div>
                      <button className="button button-primary full-button" type="button" onClick={saveFeedback}><Check size={16} /> {feedbackForm.id ? 'Save feedback and changes' : 'Save feedback and suggestions'}</button>
                    </>
                  ) : <div className="empty-illustration"><div className="small-orbit"><span /><span /><span /></div><strong>Feedback becomes a next step.</strong><p>Add a comment and ORIGANO will identify themes and suggest practical follow-through.</p></div>}
                </div>
              </div>
              <div className="panel saved-feedback-panel">
                <div className="panel-heading-row"><PanelTitle eyebrow={`${workspace.feedback.length} CAPTURED`} title="Feedback library" /><SearchField label="Search feedback" value={feedbackQuery} onChange={setFeedbackQuery} placeholder="Search comments..." /></div>
                <div className="saved-feedback-list">
                  {visibleFeedback.map((item) => <article className="saved-feedback-card" key={item.id}>
                    <div className="saved-feedback-meta"><span>{item.source}</span><span>{eventName(item.eventId)}</span><time>{formatDate(item.createdAt.slice(0, 10))}</time></div>
                    <p className="saved-feedback-quote">“{item.text}”</p>
                    <div className="saved-suggestions">
                      {item.suggestions.map((suggestion) => (
                        <div className={`saved-suggestion ${suggestion.dismissed ? 'dismissed' : ''}`} key={suggestion.id}>
                          <div className="suggestion-content">
                            <span className="category-tag">{suggestion.category}</span>
                            <label className="sr-only" htmlFor={`suggest-${suggestion.id}`}>Suggested action</label>
                            <input id={`suggest-${suggestion.id}`} value={suggestion.title} disabled={Boolean(suggestion.acceptedTaskId) || Boolean(suggestion.dismissed)} onChange={(event) => updateSuggestion(item.id, suggestion.id, { title: event.target.value })} />
                            <small>{suggestion.description}</small>
                          </div>
                          <div className="suggestion-controls">
                            {suggestion.acceptedTaskId ? <button className="button button-secondary compact" type="button" onClick={() => setPage('actions')}><CheckCircle2 size={14} /> In action plan</button> : suggestion.dismissed ? <span className="muted">Dismissed</span> : <>
                              <button className="button button-primary compact" type="button" onClick={() => acceptSuggestion(item, suggestion)}>Add action</button>
                              <button className="icon-button" type="button" aria-label="Dismiss suggestion" onClick={() => updateSuggestion(item.id, suggestion.id, { dismissed: true })}><X size={15} /></button>
                            </>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="saved-feedback-actions"><button className="text-button" type="button" onClick={() => editFeedback(item)}>Edit feedback</button><button className="text-button subtle-danger" type="button" onClick={() => deleteFeedback(item)}>Delete</button></div>
                  </article>)}
                  {!visibleFeedback.length && <EmptyState title={workspace.feedback.length ? 'No feedback matches' : 'Nothing captured yet'} detail={workspace.feedback.length ? 'Try another search.' : 'Add feedback above to begin the workflow.'} />}
                </div>
              </div>
              <Footer />
            </section>
          )}

          {page === 'actions' && (
            <section className="page-content">
              <PageIntro eyebrow="FROM INTENTION TO FOLLOW-THROUGH" title="Action plan" detail="A practical list of work connected to the event and feedback that inspired it." />
              <div className="action-metrics"><span><strong>{workspace.tasks.length}</strong> total actions</span><span><strong>{activeTasks.length}</strong> to follow through</span><span className={overdueTasks.length ? 'overdue-text' : ''}><strong>{overdueTasks.length}</strong> overdue</span><span><strong>{doneTasks.length}</strong> completed</span></div>
              <div className="action-layout">
                <form className="panel form-panel" onSubmit={createTask}>
                  <PanelTitle eyebrow={editingTaskId ? 'REFINE ACTION' : 'ADD A NEXT STEP'} title={editingTaskId ? 'Edit action' : 'Create an action'} />
                  <div className="form-grid one-column">
                    <Field label="Action title" id="task-title"><input id="task-title" required value={taskForm.title} placeholder="What will you do?" onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></Field>
                    <Field label="Description" id="task-description"><textarea id="task-description" rows={3} value={taskForm.description ?? ''} placeholder="A useful detail about how to do it..." onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} /></Field>
                    {eventSelect(taskForm.eventId, (eventId) => setTaskForm({ ...taskForm, eventId }), 'task-event', 'Related event')}
                    <Field label="Related feedback" id="task-feedback"><select id="task-feedback" value={taskForm.feedbackId ?? ''} onChange={(event) => setTaskForm({ ...taskForm, feedbackId: event.target.value || undefined })}><option value="">None</option>{workspace.feedback.map((item) => <option value={item.id} key={item.id}>{item.source}: {item.text.slice(0, 62)}{item.text.length > 62 ? '…' : ''}</option>)}</select></Field>
                    <Field label="Linked idea" id="task-idea"><select id="task-idea" value={taskForm.ideaId ?? ''} onChange={(event) => setTaskForm({ ...taskForm, ideaId: event.target.value || undefined })}><option value="">None</option>{workspace.ideas.map((idea) => <option value={idea.id} key={idea.id}>{idea.title}</option>)}</select></Field>
                    <Field label="Due date" id="task-date"><input id="task-date" type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /></Field>
                    <div className="form-pair">
                      <Field label="Priority" id="task-priority"><select id="task-priority" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
                      <Field label="Status" id="task-status"><select id="task-status" value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></Field>
                    </div>
                  </div>
                  <div className="form-actions"><button className="button button-primary" type="submit">{editingTaskId ? 'Save action' : 'Add to action plan'} <ArrowRight size={15} /></button>{editingTaskId && <button className="button button-secondary" type="button" onClick={() => { setEditingTaskId(''); setTaskForm(newTaskForm()) }}>Cancel</button>}</div>
                </form>
                <div className="panel tasks-panel">
                  <div className="panel-heading-row"><PanelTitle eyebrow={`${visibleTasks.length} SHOWN`} title="Your actions" /><SearchField label="Search actions" value={taskQuery} onChange={setTaskQuery} placeholder="Search actions..." /></div>
                  <div className="filters-row">
                    <label className="filter-control"><span>Status</span><select value={taskStatusFilter} onChange={(event) => setTaskStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></label>
                    <label className="filter-control"><span>Priority</span><select value={taskPriorityFilter} onChange={(event) => setTaskPriorityFilter(event.target.value)}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
                    <label className="filter-control"><span>Sort by</span><select value={taskSort} onChange={(event) => setTaskSort(event.target.value as typeof taskSort)}><option value="date">Due date</option><option value="priority">Priority</option><option value="created">Recently added</option></select></label>
                  </div>
                  <div className="full-task-list">
                    {visibleTasks.map((task) => <TaskRow key={task.id} task={task} eventName={eventName(task.eventId)} ideaTitle={task.ideaId ? workspace.ideas.find((idea) => idea.id === task.ideaId)?.title : undefined} onToggle={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} onOpen={() => editTask(task)} onDelete={() => deleteTask(task)} onStatus={(status) => updateTask(task.id, { status })} />)}
                    {!visibleTasks.length && <EmptyState title="No actions found" detail={workspace.tasks.length ? 'Adjust your filters or search.' : 'Create an action or accept a feedback suggestion to get started.'} />}
                  </div>
                </div>
              </div>
              <Footer />
            </section>
          )}

          {page === 'reflection' && (
            <section className="page-content">
              <PageIntro eyebrow="MAKE THE EXPERIENCE USEFUL" title="A moment to reflect." detail="Answer the questions that matter to you. Partial reflections are welcome and drafts save locally." />
              <div className="reflection-layout">
                <div className="panel reflection-workspace">
                  <div className="reflection-top"><span className="step-counter">QUESTION {reflectionQuestion + 1} / {REFLECTION_QUESTIONS.length}</span>{eventSelect(reflectionEventId, selectReflectionEvent, 'reflection-event', 'Event')}</div>
                  <div className="question-progress" aria-label={`Question ${reflectionQuestion + 1} of ${REFLECTION_QUESTIONS.length}`}><span style={{ width: `${(reflectionQuestion + 1) / REFLECTION_QUESTIONS.length * 100}%` }} /></div>
                  <label className="reflection-question" htmlFor="reflection-answer">{REFLECTION_QUESTIONS[reflectionQuestion]}</label>
                  <textarea id="reflection-answer" className="reflection-answer" rows={8} value={reflectionDraft[REFLECTION_QUESTIONS[reflectionQuestion]] ?? ''} onChange={(event) => setReflectionDraft((answers) => ({ ...answers, [REFLECTION_QUESTIONS[reflectionQuestion]]: event.target.value }))} placeholder="Start with a few honest lines..." />
                  {reflectionDraft[REFLECTION_QUESTIONS[reflectionQuestion]]?.trim() && <button className="text-button" type="button" onClick={() => reflectionToTask(REFLECTION_QUESTIONS[reflectionQuestion])}><Plus size={14} /> Add this takeaway to action plan</button>}
                  <div className="reflection-controls">
                    <button className="button button-secondary" type="button" disabled={reflectionQuestion === 0} onClick={() => setReflectionQuestion((index) => Math.max(0, index - 1))}><ChevronLeft size={16} /> Previous</button>
                    <div><button className="button button-secondary" type="button" disabled={!reflectionEventId} onClick={saveReflectionDraft}>Save draft</button><button className="button button-primary" type="button" onClick={() => setReflectionQuestion((index) => Math.min(REFLECTION_QUESTIONS.length - 1, index + 1))}>{reflectionQuestion === REFLECTION_QUESTIONS.length - 1 ? 'Review answers' : 'Next question'} <ChevronRight size={16} /></button></div>
                  </div>
                  {reflectionQuestion === REFLECTION_QUESTIONS.length - 1 && <button className="button button-primary reflection-submit" type="button" disabled={!reflectionEventId || !Object.values(reflectionDraft).some((answer) => answer.trim())} onClick={submitReflection}><Check size={15} /> Save reflection</button>}
                </div>
                <aside className="panel reflection-guide"><p className="eyebrow">A SMALL PROMPT</p><h2>Write for your future self.</h2><p>You do not need perfect answers. Capture one detail you would otherwise forget, then decide what deserves a next step.</p><div className="guide-line" /><span>YOUR REFLECTION IS PRIVATE TO THIS BROWSER</span></aside>
              </div>
              <div className="panel saved-reflections">
                <PanelTitle eyebrow={`${workspace.reflections.length} SAVED`} title="Saved reflections" />
                {workspace.reflections.length ? workspace.reflections.map((reflection) => <article className="reflection-record" key={reflection.id}>
                  <div className="reflection-record-heading"><div><span className="event-type">{eventName(reflection.eventId)}</span><small>{reflection.submittedAt ? `Saved ${formatDate(reflection.submittedAt.slice(0, 10))}` : `Draft updated ${formatDate(reflection.updatedAt.slice(0, 10))}`}</small></div><button className="icon-button danger-icon" aria-label="Delete reflection" type="button" onClick={() => deleteReflection(reflection)}><Trash2 size={15} /></button></div>
                  {Object.entries(reflection.answers).filter(([, answer]) => answer.trim()).map(([question, answer]) => <div className="reflection-answer-item" key={question}><strong>{question}</strong><p>{answer}</p></div>)}
                </article>) : <EmptyState title="No reflections saved" detail="Your reflection drafts and completed responses will appear here." />}
              </div>
              <Footer />
            </section>
          )}

          {page === 'ideas' && (
            <section className="page-content">
              <PageIntro eyebrow="KEEP THE SPARK, BUILD THE NEXT ITERATION" title="Idea vault" detail="Give promising ideas enough structure to become something real." />
              <div className="idea-layout">
                <form className="panel form-panel" onSubmit={createIdea}>
                  <PanelTitle eyebrow={editingIdeaId ? 'UPDATE IDEA' : 'CAPTURE A THOUGHT'} title={editingIdeaId ? 'Edit idea' : 'Shape an idea'} />
                  <div className="form-grid one-column">
                    <Field label="Idea title" id="idea-title"><input id="idea-title" required value={ideaForm.title} placeholder="A short, memorable name" onChange={(event) => setIdeaForm({ ...ideaForm, title: event.target.value })} /></Field>
                    {eventSelect(ideaForm.eventId, (eventId) => setIdeaForm({ ...ideaForm, eventId }), 'idea-event', 'Related event')}
                    <Field label="Problem" id="idea-problem"><textarea id="idea-problem" rows={3} value={ideaForm.problem} placeholder="What needs to change?" onChange={(event) => setIdeaForm({ ...ideaForm, problem: event.target.value })} /></Field>
                    <Field label="Proposed solution" id="idea-solution"><textarea id="idea-solution" rows={3} value={ideaForm.solution} placeholder="How could it work?" onChange={(event) => setIdeaForm({ ...ideaForm, solution: event.target.value })} /></Field>
                    <div className="form-pair">
                      <Field label="Domain" id="idea-domain"><input id="idea-domain" value={ideaForm.domain} placeholder="e.g. Education" onChange={(event) => setIdeaForm({ ...ideaForm, domain: event.target.value })} /></Field>
                      <Field label="Status" id="idea-status"><select id="idea-status" value={ideaForm.status} onChange={(event) => setIdeaForm({ ...ideaForm, status: event.target.value as IdeaStatus })}><option value="raw">Raw</option><option value="exploring">Exploring</option><option value="building">Building</option><option value="paused">Paused</option><option value="completed">Completed</option></select></Field>
                    </div>
                    <Field label="Skills to explore" id="idea-skills"><input id="idea-skills" value={ideaForm.skills} placeholder="Comma-separated" onChange={(event) => setIdeaForm({ ...ideaForm, skills: event.target.value })} /></Field>
                    <Field label="Next milestone" id="idea-milestone"><input id="idea-milestone" value={ideaForm.nextMilestone} placeholder="A small step that would move this forward" onChange={(event) => setIdeaForm({ ...ideaForm, nextMilestone: event.target.value })} /></Field>
                    <Field label="Working notes" id="idea-notes"><textarea id="idea-notes" rows={3} value={ideaForm.notes} placeholder="Questions, assumptions, references..." onChange={(event) => setIdeaForm({ ...ideaForm, notes: event.target.value })} /></Field>
                  </div>
                  <div className="form-actions"><button className="button button-primary" type="submit">{editingIdeaId ? 'Save idea' : 'Add to vault'} <ArrowRight size={15} /></button>{editingIdeaId && <button className="button button-secondary" type="button" onClick={() => { setEditingIdeaId(''); setIdeaForm(newIdeaForm()) }}>Cancel</button>}</div>
                </form>
                <div className="panel ideas-panel">
                  <div className="panel-heading-row"><PanelTitle eyebrow={`${visibleIdeas.length} SHOWN`} title="Your ideas" /><SearchField label="Search ideas" value={ideaQuery} onChange={setIdeaQuery} placeholder="Search the vault..." /></div>
                  <label className="filter-control idea-filter"><span>Stage</span><select value={ideaStatusFilter} onChange={(event) => setIdeaStatusFilter(event.target.value)}><option value="all">All stages</option><option value="raw">Raw</option><option value="exploring">Exploring</option><option value="building">Building</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label>
                  <div className="idea-list">
                    {visibleIdeas.map((idea) => <article className="idea-card" key={idea.id}>
                      <div className="idea-card-top"><span className="category-tag">{idea.domain || 'Unsorted'}</span><select aria-label={`Change ${idea.title} status`} value={idea.status} onChange={(event) => updateIdea(idea.id, { status: event.target.value as IdeaStatus })}><option value="raw">Raw</option><option value="exploring">Exploring</option><option value="building">Building</option><option value="paused">Paused</option><option value="completed">Completed</option></select></div>
                      <h3>{idea.title}</h3><p className="idea-problem">{idea.problem || 'No problem statement added yet.'}</p>{idea.solution && <p><strong>Possible direction</strong>{idea.solution}</p>}
                      {idea.nextMilestone && <div className="idea-next"><Flag size={14} /><span>{idea.nextMilestone}</span></div>}
                      <div className="idea-meta"><span>{eventName(idea.eventId)}</span>{idea.skills && <span>{idea.skills}</span>}</div>
                      <div className="idea-actions"><button className="text-button" type="button" onClick={() => editIdea(idea)}>Edit details</button><button className="text-button subtle-danger" type="button" onClick={() => deleteIdea(idea)}>Delete idea</button></div>
                    </article>)}
                    {!visibleIdeas.length && <EmptyState title="No ideas here yet" detail={workspace.ideas.length ? 'Try another search or stage.' : 'Capture an idea when a conversation, challenge, or piece of feedback gives you a new direction.'} />}
                  </div>
                </div>
              </div>
              <Footer />
            </section>
          )}

          {page === 'timeline' && (
            <section className="page-content">
              <PageIntro eyebrow="A SUGGESTED RHYTHM, NOT A DEADLINE FOR SUCCESS" title="Keep the momentum." detail="A practical 24-hour, 7-day, and 30-day guide. Adjust dates to fit your life." />
              <div className="timeline-summary"><div><span>COMPLETE</span><strong>{completedMilestones.length}<small> / {workspace.milestones.length}</small></strong></div><div className="timeline-summary-bar"><span style={{ width: `${timelineCompletion}%` }} /></div><span>{timelineCompletion}% of milestones marked done</span></div>
              <div className="timeline-board">
                {(['24h', '7d', '30d'] as const).map((window) => <section className="timeline-lane" key={window}>
                  <div className="timeline-lane-heading"><span className="timeline-number">{window === '24h' ? '01' : window === '7d' ? '02' : '03'}</span><div><span className="eyebrow">{window === '24h' ? 'FIRST 24 HOURS' : window === '7d' ? 'FIRST 7 DAYS' : 'FIRST 30 DAYS'}</span><h2>{window === '24h' ? 'Capture' : window === '7d' ? 'Follow through' : 'Build forward'}</h2></div></div>
                  <div className="milestone-list">
                    {workspace.milestones.filter((item) => item.window === window).map((milestone) => <article className={`milestone-card ${milestone.completedAt ? 'milestone-done' : ''}`} key={milestone.id}>
                      <div className="milestone-title-row"><button className={`check-control ${milestone.completedAt ? 'checked' : ''}`} type="button" aria-label={milestone.completedAt ? 'Mark milestone incomplete' : 'Mark milestone complete'} onClick={() => updateMilestone(milestone, { completedAt: milestone.completedAt ? undefined : nowIso() })}>{milestone.completedAt && <Check size={13} />}</button><input aria-label="Milestone title" value={milestone.title} onChange={(event) => updateMilestone(milestone, { title: event.target.value })} /></div>
                      <p>{milestone.description}</p>
                      <div className="milestone-footer"><label>Due <input type="date" value={milestone.dueDate} onChange={(event) => updateMilestone(milestone, { dueDate: event.target.value })} /></label>{isOverdue(milestone.dueDate, milestone.completedAt ? 'done' : 'todo') && <span className="overdue-label">Overdue</span>}<button className="text-button" type="button" onClick={() => convertMilestone(milestone)}>Add as action <ArrowRight size={13} /></button></div>
                    </article>)}
                    {!workspace.milestones.some((item) => item.window === window) && <p className="lane-empty">Nothing planned for this window yet.</p>}
                  </div>
                </section>)}
              </div>
              <div className="panel custom-milestones"><PanelTitle eyebrow="YOUR OWN PACE" title="Milestones from your action plan" /><p className="muted">Milestones can be edited directly above. Convert any one into an action to track it alongside your follow-through tasks.</p><div className="plain-activity">{workspace.milestones.filter((item) => item.completedAt).map((item) => <span key={item.id}><CheckCircle2 size={15} /> {item.title} · completed {formatDate(item.completedAt?.slice(0, 10) ?? '')}</span>)}</div></div>
              <Footer />
            </section>
          )}

          {page === 'progress' && (
            <section className="page-content">
              <PageIntro eyebrow="MEASURE WHAT YOU ACTUALLY DID" title="Progress, without the noise." detail="Every number here is calculated from the records in this browser. No simulated analytics." />
              <div className="progress-metrics">
                <Metric label="Total actions" value={workspace.tasks.length} detail={`${activeTasks.length} still open`} icon={<ListChecks size={18} />} />
                <Metric label="Completed" value={doneTasks.length} detail={`${taskCompletion}% completion`} icon={<CheckCircle2 size={18} />} />
                <Metric label="Overdue" value={overdueTasks.length} detail="Open actions past due" icon={<Clock3 size={18} />} />
                <Metric label="Active ideas" value={activeIdeas.length} detail={`${workspace.ideas.length} ideas captured`} icon={<Lightbulb size={18} />} />
                <Metric label="Milestones done" value={completedMilestones.length} detail={`${workspace.milestones.length} planned`} icon={<Flag size={18} />} />
                <Metric label="Feedback reviewed" value={feedbackReviewed} detail={`${workspace.feedback.length} items captured`} icon={<MessageSquareText size={18} />} />
              </div>
              <div className="progress-detail-grid">
                <div className="panel">
                  <PanelTitle eyebrow="ACTION STATUS" title="What is moving?" />
                  {workspace.tasks.length ? <div className="status-breakdown">{(['todo', 'in_progress', 'done'] as TaskStatus[]).map((status) => {
                    const count = workspace.tasks.filter((task) => task.status === status).length
                    const pct = workspace.tasks.length ? count / workspace.tasks.length * 100 : 0
                    return <div className="breakdown-row" key={status}><div><span>{status === 'todo' ? 'To do' : status === 'in_progress' ? 'In progress' : 'Done'}</span><strong>{count}</strong></div><div className="breakdown-track"><span className={`status-${status}`} style={{ width: `${pct}%` }} /></div></div>
                  })}</div> : <EmptyState title="No actions to measure yet" detail="Add a task or turn feedback into a next step." />}
                </div>
                <div className="panel">
                  <PanelTitle eyebrow="IDEA DEVELOPMENT" title="Ideas by stage" />
                  {workspace.ideas.length ? <div className="idea-stage-list">{(['raw', 'exploring', 'building', 'paused', 'completed'] as IdeaStatus[]).map((status) => {
                    const count = workspace.ideas.filter((idea) => idea.status === status).length
                    return <div key={status}><span className={`idea-stage-dot ${status}`} /><span>{status[0].toUpperCase() + status.slice(1)}</span><strong>{count}</strong></div>
                  })}</div> : <EmptyState title="No ideas captured" detail="New ideas appear here as soon as they are saved in the vault." />}
                </div>
              </div>
              <div className="panel progress-activity"><PanelTitle eyebrow="THE WORK BEHIND THE NUMBERS" title="Activity history" />
                {workspace.activity.length ? <div className="activity-list">{workspace.activity.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.title}</strong><p>{item.detail}{item.eventId ? ` · ${eventName(item.eventId)}` : ''}</p><small>{formatTimestamp(item.createdAt)}</small></div></div>)}</div> : <EmptyState title="A fresh start" detail="Updates to events, reflections, feedback, actions, and ideas will build your activity history." />}</div>
              <Footer />
            </section>
          )}

          {page === 'opportunities' && <OpportunitiesPage ideas={workspace.ideas} extras={extras} onChange={setExtras} />}
          {page === 'connections' && <ConnectionsPage extras={extras} onChange={setExtras} />}
          {page === 'organizer' && <OrganizerPage workspace={workspace} extras={extras} />}
          {page === 'thanks' && <ThanksPage onGo={setPage} />}
          {page === 'notfound' && <NotFoundPage onHome={() => setPage('overview')} />}
          {page === 'settings' && (
            <section className="page-content">
              <PageIntro eyebrow="YOUR DATA, YOUR DEVICE" title="Data & settings" detail="Your workspace stays in this browser. Export a copy whenever you want to move or back up your records." />
              <div className="settings-layout">
                <div className="panel">
                  <PanelTitle eyebrow="YOUR PROFILE" title="A little context" />
                  <Field label="Display name" id="display-name"><input id="display-name" value={workspace.displayName} placeholder="Name shown in your workspace" onChange={(event) => setWorkspace((state) => ({ ...state, displayName: event.target.value }))} /></Field>
                  <p className="form-note">No account is created. This name is saved only in this browser.</p>
                </div>
                <div className="panel data-panel">
                  <PanelTitle eyebrow="PORTABLE BY DESIGN" title="Export or import" />
                  <p>Export your complete workspace as JSON. Import accepts a versioned ORIGANO export and will replace the current local workspace.</p>
                  <div className="data-summary"><span>{workspace.events.length} events</span><span>{workspace.feedback.length} feedback items</span><span>{workspace.tasks.length} actions</span><span>{workspace.ideas.length} ideas</span><span>{workspace.reflections.length} reflections</span></div>
                  <div className="form-actions">
                    <button className="button button-primary" type="button" onClick={() => exportWorkspace(workspace)}><ArrowDownToLine size={16} /> Export workspace</button>
                    <button className="button button-secondary" type="button" onClick={() => importRef.current?.click()}><FileUp size={16} /> Import workspace</button>
                    <input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={handleImport} />
                  </div>
                  {importMessage && <p className={importMessage.startsWith('Imported') ? 'success-message' : 'error-message'} role="status">{importMessage}</p>}
                </div>
                <div className="panel privacy-panel">
                  <PanelTitle eyebrow="LOCAL-FIRST" title="What private means here" />
                  <ul><li>Your information is stored in local browser storage on this device.</li><li>There is no account, server, cross-device sync, or shared publishing.</li><li>Export a JSON copy before clearing browser data or changing devices.</li><li>Connections and opportunity features that may be added later cannot contact other people without a shared service.</li></ul>
                </div>
                <div className="panel reset-panel">
                  <PanelTitle eyebrow="CAREFUL ACTIONS" title="Reset this workspace" />
                  <p>Restore the included sample event and its connected records, or clear all ORIGANO data saved in this browser.</p>
                  <div className="form-actions"><button className="button button-secondary" type="button" onClick={loadSamples}><RotateCcw size={15} /> Restore sample workspace</button><button className="button button-danger" type="button" onClick={clearData}><Trash2 size={15} /> Clear local data</button></div>
                </div>
              </div>
              <Footer />
            </section>
          )}
        </div>
      </main>
      {page !== 'feedback' && <div className="sticky-cta"><button className="button button-cta" type="button" onClick={() => setPage('feedback')}>Paste your feedback</button></div>}
      {notice && <div className="toast" role="status"><CheckCircle2 size={17} />{notice}<button aria-label="Dismiss notification" type="button" onClick={() => setNotice('')}><X size={15} /></button></div>}
    </div>
  )
}

function Metric({ label, value, detail, icon }: { label: string; value: number | string; detail: string; icon: ReactNode }) {
  return <div className="metric-card"><div className="metric-top"><span>{icon}</span><small>{label}</small></div><strong>{value}</strong><p>{detail}</p></div>
}

function PanelTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="panel-title"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>
}

function PageIntro({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{detail}</p></div>
}

function Field({ label, id, hint, wide, children }: { label: string; id: string; hint?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`field ${wide ? 'wide' : ''}`}><label htmlFor={id}>{label}</label>{children}{hint && <small>{hint}</small>}</div>
}

function SearchField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="search-field"><span className="sr-only">{label}</span><Compass size={15} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-mark"><Compass size={18} /></span><strong>{title}</strong><p>{detail}</p>{action}</div>
}

function TaskRow({ task, eventName, ideaTitle, onToggle, onOpen, onDelete, onStatus }: {
  task: ActionTask
  eventName: string
  ideaTitle?: string
  onToggle: () => void
  onOpen: () => void
  onDelete?: () => void
  onStatus?: (status: TaskStatus) => void
}) {
  const overdue = isOverdue(task.dueDate, task.status)
  return <article className={`task-row ${task.status === 'done' ? 'task-complete' : ''}`}>
    <button className={`task-check ${task.status === 'done' ? 'checked' : ''}`} type="button" aria-label={task.status === 'done' ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={onToggle}>{task.status === 'done' && <Check size={14} />}</button>
    <div className="task-row-content"><button className="task-title-button" type="button" onClick={onOpen}>{task.title}</button><p>{task.description || 'No description added.'}</p><div className="task-meta"><span>{eventName}</span>{task.feedbackId && <span>From feedback</span>}{ideaTitle && <span>Idea · {ideaTitle}</span>}<span className={overdue ? 'overdue-label' : ''}>{task.dueDate ? `${overdue ? 'Overdue · ' : 'Due '}${formatDate(task.dueDate)}` : 'No due date'}</span></div></div>
    <div className="task-row-actions"><span className={`priority-badge ${task.priority}`}>{task.priority}</span>{onStatus && <select aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => onStatus(event.target.value as TaskStatus)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select>}<button className="icon-button" type="button" aria-label={`Edit ${task.title}`} onClick={onOpen}><NotebookPen size={14} /></button>{onDelete && <button className="icon-button danger-icon" type="button" aria-label={`Delete ${task.title}`} onClick={onDelete}><Trash2 size={14} /></button>}</div>
  </article>
}

function SuggestionEditor({ suggestion, onChange, onRemove }: { suggestion: FeedbackSuggestion; onChange: (changes: Partial<FeedbackSuggestion>) => void; onRemove: () => void }) {
  return <article className="suggestion-card">
    <div className="suggestion-top"><span className="category-tag">{suggestion.category}</span><button className="icon-button" type="button" aria-label="Remove suggestion" onClick={onRemove}><X size={14} /></button></div>
    <label className="field"><span>Suggested action</span><input value={suggestion.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
    <label className="field"><span>Details</span><textarea rows={2} value={suggestion.description} onChange={(event) => onChange({ description: event.target.value })} /></label>
    <div className="form-pair">
      <label className="field"><span>Priority</span><select value={suggestion.priority} onChange={(event) => onChange({ priority: event.target.value as Priority })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
      <label className="field"><span>Suggested due date</span><input type="date" value={suggestion.dueDate} onChange={(event) => onChange({ dueDate: event.target.value })} /></label>
    </div>
  </article>
}

function JourneyVisual({ onSelect }: { onSelect: (page: Page) => void }) {
  const [stage, setStage] = useState(1)
  const stages = [
    { title: 'Reflect', page: 'reflection' as Page, caption: 'Give the experience a place to land.' },
    { title: 'Capture', page: 'feedback' as Page, caption: 'Gather feedback and useful detail.' },
    { title: 'Act', page: 'actions' as Page, caption: 'Choose a next step you can own.' },
    { title: 'Connect', page: 'ideas' as Page, caption: 'Carry the idea into its next form.' },
  ]
  return <div className="journey-visual-panel">
    <div className="visual-heading"><span className="eyebrow">A WORKING RHYTHM</span><span className="visual-stage-count">0{stage + 1} / 04</span></div>
    <button className={`organic-art stage-${stage}`} type="button" aria-label={`Current journey stage ${stages[stage].title}; click to advance`} onClick={() => setStage((value) => (value + 1) % stages.length)}>
      <span className="art-orbit orbit-back" /><span className="art-orbit orbit-front" />
      <span className="art-stem" /><span className="art-leaf leaf-left" /><span className="art-leaf leaf-right" />
      <span className="art-node node-a" /><span className="art-node node-b" /><span className="art-node node-c" /><span className="art-node node-d" />
      <span className="art-center">{stage + 1}</span><span className="art-hint">Tap to move forward</span>
    </button>
    <div className="visual-caption"><span className="stage-number">0{stage + 1}</span><div><strong>{stages[stage].title}</strong><p>{stages[stage].caption}</p></div><button type="button" className="icon-button" aria-label={`Open ${stages[stage].title}`} onClick={() => onSelect(stages[stage].page)}><ArrowRight size={17} /></button></div>
    <div className="visual-steps" aria-label="Journey stages">{stages.map((item, index) => <button key={item.title} type="button" aria-label={`Show ${item.title} stage`} aria-pressed={stage === index} className={stage === index ? 'active' : ''} onClick={() => setStage(index)} />)}</div>
  </div>
}

function Footer() {
  return <footer className="app-footer"><span>ORIGANO · A private, local-first workspace</span><span>Made by Sundram Yadav and Yugnsh Sethi</span></footer>
}

export default App
