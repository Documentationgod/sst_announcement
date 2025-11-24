import type { PriorityLevel } from '@/utils/priorityMapping'

/**
 * Category definitions with labels and priority levels
 * Priority mapping:
 * - P1: academic (High Priority)
 * - P2: tech-events, tech-workshops, cultural (Medium Priority)
 * - P3: college, sports (Normal Priority)
 */
export const CATEGORY_CONFIG = {
  'college': {
    label: 'College',
    priority: 'P3' as PriorityLevel,
  },
  'tech-events': {
    label: 'Tech Events',
    priority: 'P2' as PriorityLevel,
  },
  'tech-workshops': {
    label: 'Tech Workshops',
    priority: 'P2' as PriorityLevel,
  },
  'academic': {
    label: 'Academic',
    priority: 'P1' as PriorityLevel,
  },
  'sports': {
    label: 'Sports',
    priority: 'P3' as PriorityLevel,
  },
  'cultural': {
    label: 'Cultural',
    priority: 'P2' as PriorityLevel,
  },
} as const

export const CATEGORIES = [
  'college',
  'tech-events',
  'tech-workshops',
  'academic',
  'sports',
  'cultural',
] as const satisfies readonly (keyof typeof CATEGORY_CONFIG)[]

export type Category = typeof CATEGORIES[number]

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  Object.entries(CATEGORY_CONFIG).map(([key, config]) => [key, config.label])
) as Record<Category, string>

export const CATEGORY_OPTIONS = CATEGORIES.map(category => ({
  value: category,
  label: CATEGORY_LABELS[category]
}))

/**
 * Get priority level for a category
 * Uses the priority defined in CATEGORY_CONFIG
 */
export const getCategoryPriority = (category: Category): PriorityLevel => {
  return CATEGORY_CONFIG[category]?.priority ?? 'P3'
}