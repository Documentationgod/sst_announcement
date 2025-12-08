import type { PriorityLevel } from '@/utils/priorityMapping'

/**
 * Category definitions with labels and priority levels
 * Priority mapping:
 * - P1: academic (High Priority)
 * - P2: sil, club (Medium Priority)
 * - P3: general (Normal Priority)
 */
export const CATEGORY_CONFIG = {
  'academic': {
    label: 'Academic',
    priority: 'P1' as PriorityLevel,
  },
  'sil': {
    label: 'SIL',
    priority: 'P2' as PriorityLevel,
  },
  'clubs': {
    label: 'Clubs',
    priority: 'P2' as PriorityLevel,
  },
  'general': {
    label: 'General',
    priority: 'P3' as PriorityLevel,
  },
} as const

export const CATEGORIES = [
  'academic',
  'sil',
  'clubs',
  'general',
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