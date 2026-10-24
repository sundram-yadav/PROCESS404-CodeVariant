import {
  createEmptyWorkspace,
  createSampleWorkspace,
  type WorkspaceState,
} from '../model'

const STORAGE_KEY = 'origano-workspace-v2'
const LEGACY_KEY = 'origano-workspace-v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string'
}

function isTextRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(hasText)
}

function isEvent(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.name) && hasText(value.type)
    && hasText(value.date) && hasText(value.description) && hasText(value.role)
    && hasText(value.outcome) && hasText(value.notes) && hasText(value.createdAt)
}

function isSuggestion(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.category) && hasText(value.title)
    && hasText(value.description) && hasText(value.priority) && hasText(value.dueDate)
}

function isFeedback(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.eventId) && hasText(value.source)
    && hasText(value.text) && hasText(value.createdAt)
    && Array.isArray(value.suggestions) && value.suggestions.every(isSuggestion)
}

function isTask(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.eventId) && hasText(value.title)
    && hasText(value.description) && ['todo', 'in_progress', 'done'].includes(String(value.status))
    && ['low', 'medium', 'high'].includes(String(value.priority))
    && hasText(value.dueDate) && hasText(value.createdAt) && hasText(value.updatedAt)
}

function isIdea(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.eventId) && hasText(value.title)
    && hasText(value.problem) && hasText(value.solution) && hasText(value.domain)
    && hasText(value.skills) && hasText(value.notes) && hasText(value.nextMilestone)
    && ['raw', 'exploring', 'building', 'paused', 'completed'].includes(String(value.status))
    && hasText(value.createdAt) && hasText(value.updatedAt)
}

function isReflection(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.eventId)
    && isTextRecord(value.answers) && hasText(value.updatedAt)
    && (value.submittedAt === undefined || hasText(value.submittedAt))
}

function isMilestone(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.eventId) && hasText(value.title)
    && hasText(value.description) && ['24h', '7d', '30d'].includes(String(value.window))
    && hasText(value.dueDate)
    && (value.completedAt === undefined || hasText(value.completedAt))
}

function isActivity(value: unknown): boolean {
  return isRecord(value)
    && hasText(value.id) && hasText(value.title) && hasText(value.detail)
    && hasText(value.createdAt)
    && (value.eventId === undefined || hasText(value.eventId))
}

export function isWorkspace(value: unknown): value is WorkspaceState {
  if (!isRecord(value)) return false
  return value.schemaVersion === 2
    && typeof value.displayName === 'string'
    && typeof value.currentEventId === 'string'
    && Array.isArray(value.events) && value.events.every(isEvent)
    && Array.isArray(value.feedback) && value.feedback.every(isFeedback)
    && Array.isArray(value.tasks) && value.tasks.every(isTask)
    && Array.isArray(value.ideas) && value.ideas.every(isIdea)
    && Array.isArray(value.reflections) && value.reflections.every(isReflection)
    && Array.isArray(value.milestones) && value.milestones.every(isMilestone)
    && Array.isArray(value.activity) && value.activity.every(isActivity)
}

function migrateLegacyWorkspace(value: unknown): WorkspaceState | undefined {
  if (!isRecord(value)) return undefined
  const now = new Date().toISOString()
  const currentEvent = hasText(value.currentEvent) && value.currentEvent.trim() ? value.currentEvent : ''
  const legacyTasks = Array.isArray(value.tasks) ? value.tasks.filter(isRecord) : []
  const legacyIdeas = Array.isArray(value.ideas) ? value.ideas.filter(isRecord) : []
  const legacyFeedback = Array.isArray(value.feedback) ? value.feedback.filter(isRecord) : []
  const legacyReflections = Array.isArray(value.reflections) ? value.reflections.filter(isRecord) : []
  const legacyMilestones = Array.isArray(value.milestones) ? value.milestones.filter(isRecord) : []
  const legacyActivity = Array.isArray(value.activity) ? value.activity.filter(isRecord) : []
  const legacyNotes = Array.isArray(value.notes) ? value.notes.filter(isRecord) : []
  const eventId = currentEvent ? 'migrated-event' : ''
  const event = currentEvent ? [{
    id: eventId,
    name: currentEvent,
    type: 'Other' as const,
    date: now.slice(0, 10),
    description: 'Migrated from an earlier ORIGANO workspace.',
    role: '',
    outcome: '',
    notes: legacyNotes.map((note) => `${hasText(note.title) ? note.title : 'Note'}: ${hasText(note.content) ? note.content : ''}`).join('\n\n'),
    createdAt: now,
  }] : []

  if (!currentEvent && !legacyTasks.length && !legacyIdeas.length && !legacyFeedback.length) return undefined

  return {
    schemaVersion: 2,
    displayName: hasText(value.displayName) ? value.displayName : '',
    currentEventId: eventId,
    events: event,
    feedback: legacyFeedback.map((feedback, index) => ({
      id: hasText(feedback.id) ? feedback.id : `migrated-feedback-${index}`,
      eventId,
      source: hasText(feedback.source) ? feedback.source : 'Imported feedback',
      text: hasText(feedback.text) ? feedback.text : hasText(feedback.content) ? feedback.content : '',
      createdAt: hasText(feedback.createdAt) ? feedback.createdAt : now,
      suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions.filter(isRecord).map((suggestion, suggestionIndex) => ({
        id: hasText(suggestion.id) ? suggestion.id : `migrated-suggestion-${index}-${suggestionIndex}`,
        category: 'Other' as const,
        title: hasText(suggestion.title) ? suggestion.title : hasText(suggestion.text) ? suggestion.text : 'Review feedback',
        description: hasText(suggestion.description) ? suggestion.description : 'Imported from an earlier workspace.',
        priority: ['low', 'medium', 'high'].includes(String(suggestion.priority)) ? suggestion.priority as 'low' | 'medium' | 'high' : 'medium',
        dueDate: hasText(suggestion.dueDate) ? suggestion.dueDate.slice(0, 10) : '',
        acceptedTaskId: hasText(suggestion.createdTaskId) ? suggestion.createdTaskId : undefined,
      })) : [],
    })).filter((feedback) => feedback.text),
    tasks: legacyTasks.filter((task) => hasText(task.title)).map((task, index) => ({
      id: hasText(task.id) ? task.id : `migrated-task-${index}`,
      eventId,
      feedbackId: hasText(task.feedbackId) ? task.feedbackId : undefined,
      ideaId: hasText(task.linkedIdea) ? task.linkedIdea : undefined,
      title: task.title as string,
      description: hasText(task.description) ? task.description : '',
      status: ['todo', 'in_progress', 'done'].includes(String(task.status)) ? task.status as 'todo' | 'in_progress' | 'done' : 'todo',
      priority: ['low', 'medium', 'high'].includes(String(task.priority)) ? task.priority as 'low' | 'medium' | 'high' : 'medium',
      dueDate: hasText(task.dueDate) ? task.dueDate.slice(0, 10) : hasText(task.deadline) ? task.deadline.slice(0, 10) : '',
      createdAt: hasText(task.createdAt) ? task.createdAt : now,
      updatedAt: hasText(task.updatedAt) ? task.updatedAt : now,
    })),
    ideas: legacyIdeas.filter((idea) => hasText(idea.title)).map((idea, index) => ({
      id: hasText(idea.id) ? idea.id : `migrated-idea-${index}`,
      eventId,
      title: idea.title as string,
      problem: hasText(idea.problem) ? idea.problem : '',
      solution: hasText(idea.solution) ? idea.solution : '',
      domain: hasText(idea.domain) ? idea.domain : '',
      skills: Array.isArray(idea.skills) ? idea.skills.filter(hasText).join(', ') : hasText(idea.skills) ? idea.skills : '',
      notes: hasText(idea.notes) ? idea.notes : '',
      nextMilestone: hasText(idea.nextMilestone) ? idea.nextMilestone : '',
      status: ['raw', 'exploring', 'building', 'paused', 'completed'].includes(String(idea.status)) ? idea.status as 'raw' | 'exploring' | 'building' | 'paused' | 'completed' : 'raw',
      createdAt: hasText(idea.createdAt) ? idea.createdAt : now,
      updatedAt: hasText(idea.updatedAt) ? idea.updatedAt : now,
    })),
    reflections: legacyReflections.map((reflection, index) => ({
      id: hasText(reflection.id) ? reflection.id : `migrated-reflection-${index}`,
      eventId,
      answers: Array.isArray(reflection.answers)
        ? Object.fromEntries(reflection.answers.filter(isRecord).filter((answer) => hasText(answer.question) && hasText(answer.answer)).map((answer) => [answer.question as string, answer.answer as string]))
        : isTextRecord(reflection.answers) ? reflection.answers : {},
      updatedAt: hasText(reflection.updatedAt) ? reflection.updatedAt : hasText(reflection.submittedAt) ? reflection.submittedAt : now,
      submittedAt: hasText(reflection.submittedAt) ? reflection.submittedAt : undefined,
    })),
    milestones: legacyMilestones.map((milestone, index) => ({
      id: hasText(milestone.id) ? milestone.id : `migrated-milestone-${index}`,
      eventId,
      title: hasText(milestone.title) ? milestone.title : 'Imported milestone',
      description: hasText(milestone.description) ? milestone.description : '',
      window: ['24h', '7d', '30d'].includes(String(milestone.window)) ? milestone.window as '24h' | '7d' | '30d' : '30d',
      dueDate: hasText(milestone.dueDate) ? milestone.dueDate.slice(0, 10) : hasText(milestone.deadline) ? milestone.deadline.slice(0, 10) : '',
      completedAt: milestone.completed === true ? now : undefined,
    })),
    activity: legacyActivity.map((item, index) => ({
      id: hasText(item.id) ? item.id : `migrated-activity-${index}`,
      eventId,
      title: hasText(item.title) ? item.title : 'Workspace activity',
      detail: hasText(item.detail) ? item.detail : '',
      createdAt: hasText(item.at) ? item.at : hasText(item.createdAt) ? item.createdAt : now,
    })),
  }
}

export function loadWorkspace(): WorkspaceState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      return isWorkspace(parsed) ? parsed : createSampleWorkspace()
    }

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const migrated = migrateLegacyWorkspace(JSON.parse(legacy))
      if (migrated) return migrated
    }

    return createSampleWorkspace()
  } catch (error) {
    console.error('Could not read the ORIGANO workspace from browser storage.', error)
    return createSampleWorkspace()
  }
}

export function saveWorkspace(workspace: WorkspaceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
}

export function normalizeImportedWorkspace(value: unknown): WorkspaceState {
  if (!isWorkspace(value)) {
    throw new Error('This file is not a supported ORIGANO workspace export.')
  }

  const state = value
  const eventIds = new Set(state.events.map((event) => event.id))
  const validCurrentEventId = eventIds.has(state.currentEventId) ? state.currentEventId : ''
  const validEvent = (eventId: string) => !eventId || eventIds.has(eventId) ? eventId : ''
  const taskIds = new Set(state.tasks.map((task) => task.id))

  return {
    ...state,
    currentEventId: validCurrentEventId,
    feedback: state.feedback.filter((feedback) => typeof feedback.text === 'string').map((feedback) => ({
      ...feedback,
      eventId: validEvent(feedback.eventId),
      suggestions: feedback.suggestions.filter((suggestion) => typeof suggestion.title === 'string').map((suggestion) => ({
        ...suggestion,
        acceptedTaskId: suggestion.acceptedTaskId && taskIds.has(suggestion.acceptedTaskId)
          ? suggestion.acceptedTaskId
          : undefined,
      })),
    })),
    tasks: state.tasks.filter((task) => typeof task.title === 'string').map((task) => ({
      ...task,
      eventId: validEvent(task.eventId),
    })),
    ideas: state.ideas.filter((idea) => typeof idea.title === 'string').map((idea) => ({
      ...idea,
      eventId: validEvent(idea.eventId),
    })),
    reflections: state.reflections.map((reflection) => ({
      ...reflection,
      eventId: validEvent(reflection.eventId),
    })),
    milestones: state.milestones.map((milestone) => ({
      ...milestone,
      eventId: validEvent(milestone.eventId),
    })),
    activity: state.activity.map((item) => ({
      ...item,
      eventId: item.eventId ? validEvent(item.eventId) : undefined,
    })),
  }
}

export function resetWorkspace(): WorkspaceState {
  return createSampleWorkspace()
}

export function clearWorkspace(): WorkspaceState {
  return createEmptyWorkspace()
}

export function exportWorkspace(workspace: WorkspaceState): void {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'origano-workspace.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
