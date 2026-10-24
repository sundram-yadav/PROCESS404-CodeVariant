export type EventType = 'Hackathon' | 'Competition' | 'Conference' | 'Workshop' | 'Networking' | 'Other'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type IdeaStatus = 'raw' | 'exploring' | 'building' | 'paused' | 'completed'
export type FeedbackCategory =
  | 'Problem validation'
  | 'User experience'
  | 'Technical execution'
  | 'Product clarity'
  | 'Presentation'
  | 'Business model'
  | 'Collaboration'
  | 'Research'
  | 'Other'

export interface EventRecord {
  id: string
  name: string
  type: EventType
  date: string
  description: string
  role: string
  outcome: string
  notes: string
  createdAt: string
}

export interface FeedbackSuggestion {
  id: string
  category: FeedbackCategory
  title: string
  description: string
  priority: Priority
  dueDate: string
  acceptedTaskId?: string
  dismissed?: boolean
}

export interface FeedbackRecord {
  id: string
  eventId: string
  source: string
  text: string
  createdAt: string
  suggestions: FeedbackSuggestion[]
}

export interface ActionTask {
  id: string
  eventId: string
  feedbackId?: string
  ideaId?: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface IdeaRecord {
  id: string
  eventId: string
  title: string
  problem: string
  solution: string
  domain: string
  skills: string
  notes: string
  nextMilestone: string
  status: IdeaStatus
  createdAt: string
  updatedAt: string
}

export interface ReflectionRecord {
  id: string
  eventId: string
  answers: Record<string, string>
  updatedAt: string
  submittedAt?: string
}

export interface TimelineMilestone {
  id: string
  eventId: string
  title: string
  description: string
  window: '24h' | '7d' | '30d'
  dueDate: string
  completedAt?: string
}

export interface ActivityRecord {
  id: string
  eventId?: string
  title: string
  detail: string
  createdAt: string
}

export interface WorkspaceState {
  schemaVersion: 2
  displayName: string
  currentEventId: string
  events: EventRecord[]
  feedback: FeedbackRecord[]
  tasks: ActionTask[]
  ideas: IdeaRecord[]
  reflections: ReflectionRecord[]
  milestones: TimelineMilestone[]
  activity: ActivityRecord[]
}

export const REFLECTION_QUESTIONS = [
  'What did you learn?',
  'What surprised you?',
  'What would you do differently?',
  'What do you want to build next?',
  'Which people or ideas should you follow up on?',
  'What is the most important next step?',
] as const

export function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`
}

function dateOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function createEmptyWorkspace(): WorkspaceState {
  return {
    schemaVersion: 2,
    displayName: '',
    currentEventId: '',
    events: [],
    feedback: [],
    tasks: [],
    ideas: [],
    reflections: [],
    milestones: [],
    activity: [],
  }
}

export function createSampleWorkspace(): WorkspaceState {
  const now = new Date().toISOString()
  const eventId = 'event-build-01'
  const feedbackOne = 'feedback-judge-validation'
  const feedbackTwo = 'feedback-mentor-ux'
  const feedbackThree = 'feedback-team-presentation'

  return {
    schemaVersion: 2,
    displayName: '',
    currentEventId: eventId,
    events: [{
      id: eventId,
      name: 'Build 01 — Round 2',
      type: 'Hackathon',
      date: dateOffset(-2),
      description: 'A weekend build challenge focused on turning an early product idea into a useful prototype.',
      role: 'Product and frontend',
      outcome: 'Shortlisted',
      notes: 'Bring the strongest user evidence into the next iteration.',
      createdAt: now,
    }],
    feedback: [
      {
        id: feedbackOne,
        eventId,
        source: 'Judge',
        text: 'The prototype is promising, but the problem needs stronger evidence from real users. Interview people who face this issue before expanding the feature set.',
        createdAt: now,
        suggestions: [
          {
            id: 'suggest-validation-interviews',
            category: 'Problem validation',
            title: 'Interview five potential users',
            description: 'Document how often the problem occurs and what people do today.',
            priority: 'high',
            dueDate: dateOffset(5),
            acceptedTaskId: 'task-user-interviews',
          },
          {
            id: 'suggest-validation-findings',
            category: 'Research',
            title: 'Summarize problem-validation findings',
            description: 'Capture evidence, patterns, and open questions from the interviews.',
            priority: 'medium',
            dueDate: dateOffset(7),
          },
        ],
      },
      {
        id: feedbackTwo,
        eventId,
        source: 'Mentor',
        text: 'The onboarding is confusing. Make the first step clearer and show people how their notes become an action plan.',
        createdAt: now,
        suggestions: [
          {
            id: 'suggest-ux-onboarding',
            category: 'User experience',
            title: 'Simplify the first-run onboarding',
            description: 'Reduce the initial choices and make the next step visible.',
            priority: 'high',
            dueDate: dateOffset(3),
            acceptedTaskId: 'task-onboarding',
          },
        ],
      },
      {
        id: feedbackThree,
        eventId,
        source: 'Personal observation',
        text: 'Our presentation moved too quickly through the user story. We should rehearse a clearer demonstration of the problem and product flow.',
        createdAt: now,
        suggestions: [
          {
            id: 'suggest-presentation-rehearsal',
            category: 'Presentation',
            title: 'Rehearse the user story and product walkthrough',
            description: 'Use one concise example to explain the problem, workflow, and outcome.',
            priority: 'medium',
            dueDate: dateOffset(6),
            acceptedTaskId: 'task-rehearse',
          },
        ],
      },
    ],
    tasks: [
      {
        id: 'task-user-interviews',
        eventId,
        feedbackId: feedbackOne,
        title: 'Interview five potential users',
        description: 'Document how often the problem occurs and what people do today.',
        status: 'todo',
        priority: 'high',
        dueDate: dateOffset(5),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-onboarding',
        eventId,
        feedbackId: feedbackTwo,
        title: 'Simplify the first-run onboarding',
        description: 'Reduce the initial choices and make the next step visible.',
        status: 'in_progress',
        priority: 'high',
        dueDate: dateOffset(3),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-rehearse',
        eventId,
        feedbackId: feedbackThree,
        title: 'Rehearse the user story and product walkthrough',
        description: 'Use one concise example to explain the problem, workflow, and outcome.',
        status: 'done',
        priority: 'medium',
        dueDate: dateOffset(-1),
        createdAt: now,
        updatedAt: now,
      },
    ],
    ideas: [
      {
        id: 'idea-event-follow-through',
        eventId,
        title: 'After-event operating system',
        problem: 'Event learnings, feedback, and follow-ups often get scattered across chats and notes.',
        solution: 'A calm workspace that organizes reflections into practical follow-through.',
        domain: 'Productivity',
        skills: 'UX research, product strategy',
        notes: 'Validate the workflow with participants from different kinds of events.',
        nextMilestone: 'Complete five user interviews',
        status: 'exploring',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'idea-collaborator-relay',
        eventId,
        title: 'Collaborator relay',
        problem: 'People lose context for promising conversations after a conference or build weekend.',
        solution: 'A personal follow-up log connected to shared interests and project goals.',
        domain: 'Community',
        skills: 'Research, community design',
        notes: '',
        nextMilestone: 'Sketch a contact follow-up flow',
        status: 'raw',
        createdAt: now,
        updatedAt: now,
      },
    ],
    reflections: [{
      id: 'reflection-build-01',
      eventId,
      answers: {
        'What did you learn?': 'A focused user story made the product easier to understand.',
        'What surprised you?': 'The most useful feedback was about validation, not adding features.',
        'What would you do differently?': 'I would speak with users before building the prototype.',
      },
      updatedAt: now,
      submittedAt: now,
    }],
    milestones: [
      {
        id: 'milestone-24h',
        eventId,
        title: 'Capture the important takeaways',
        description: 'Record learning and feedback while the event is still fresh.',
        window: '24h',
        dueDate: dateOffset(1),
      },
      {
        id: 'milestone-7d',
        eventId,
        title: 'Follow up on the strongest feedback',
        description: 'Turn the most important critique into a testable improvement.',
        window: '7d',
        dueDate: dateOffset(5),
      },
      {
        id: 'milestone-30d',
        eventId,
        title: 'Review the next project milestone',
        description: 'Check what changed, what you learned, and what deserves attention next.',
        window: '30d',
        dueDate: dateOffset(28),
      },
    ],
    activity: [
      { id: 'activity-1', eventId, title: 'Event workspace ready', detail: 'Sample event and follow-through plan loaded.', createdAt: now },
    ],
  }
}
