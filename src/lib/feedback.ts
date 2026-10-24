import { createId, type FeedbackCategory, type FeedbackSuggestion, type Priority } from '../model'

interface Rule {
  category: FeedbackCategory
  keywords: string[]
  title: string
  description: string
  priority: Priority
}

const RULES: Rule[] = [
  {
    category: 'Problem validation',
    keywords: ['problem', 'validate', 'validation', 'evidence', 'user need', 'pain point', 'assumption'],
    title: 'Validate the problem with potential users',
    description: 'Talk to people who may experience this problem and record concrete evidence.',
    priority: 'high',
  },
  {
    category: 'User experience',
    keywords: ['onboarding', 'confusing', 'usability', 'user experience', 'ux', 'navigation', 'flow', 'interface'],
    title: 'Review and simplify the user experience',
    description: 'Identify the confusing step, then make the next action easier to understand.',
    priority: 'high',
  },
  {
    category: 'Technical execution',
    keywords: ['technical', 'performance', 'bug', 'reliable', 'architecture', 'integration', 'scalability'],
    title: 'Resolve the highest-impact technical risk',
    description: 'Reproduce the concern, capture its impact, and validate a focused fix.',
    priority: 'high',
  },
  {
    category: 'Product clarity',
    keywords: ['clarity', 'unclear', 'value proposition', 'feature', 'product', 'prototype'],
    title: 'Clarify the product value and core workflow',
    description: 'Explain who the product helps and the outcome it enables in one clear flow.',
    priority: 'medium',
  },
  {
    category: 'Presentation',
    keywords: ['presentation', 'demo', 'pitch', 'story', 'slides', 'explain', 'rehearse'],
    title: 'Refine and rehearse the product story',
    description: 'Practice a concise narrative that connects the problem, solution, and evidence.',
    priority: 'medium',
  },
  {
    category: 'Business model',
    keywords: ['business model', 'revenue', 'pricing', 'market', 'customer', 'sustainable'],
    title: 'Test the business model assumptions',
    description: 'Write down the key market and sustainability assumptions to validate next.',
    priority: 'medium',
  },
  {
    category: 'Collaboration',
    keywords: ['team', 'collaboration', 'communication', 'roles', 'handoff', 'partner'],
    title: 'Agree on a clear team follow-through plan',
    description: 'Confirm ownership, responsibilities, and the next point to reconnect.',
    priority: 'medium',
  },
  {
    category: 'Research',
    keywords: ['research', 'interview', 'survey', 'data', 'measure', 'test'],
    title: 'Gather evidence for the open research question',
    description: 'Choose a lightweight research method and summarize what you learn.',
    priority: 'medium',
  },
]

export interface AnalysisResult {
  categories: FeedbackCategory[]
  suggestions: FeedbackSuggestion[]
}

export function analyzeFeedback(text: string, date = new Date()): AnalysisResult {
  const normalized = text.toLocaleLowerCase()
  const matched = RULES.filter((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)))
  const rules = matched.length ? matched : [{
    category: 'Other' as const,
    keywords: [],
    title: 'Review this feedback and choose one practical next step',
    description: 'Re-read the comment, clarify what it means for your project, and decide how to test it.',
    priority: 'medium' as const,
  }]

  const suggestions = rules.map((rule) => {
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + (rule.priority === 'high' ? 5 : 7))
    return {
      id: createId('suggestion'),
      category: rule.category,
      title: rule.title,
      description: rule.description,
      priority: rule.priority,
      dueDate: dueDate.toISOString().slice(0, 10),
    }
  })

  return {
    categories: rules.map((rule) => rule.category),
    suggestions,
  }
}
