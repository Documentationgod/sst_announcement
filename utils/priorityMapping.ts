export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export interface CategoryPriorityMap {
  [category: string]: PriorityLevel;
}


export const CATEGORY_PRIORITY_MAP: CategoryPriorityMap = {
  'academic': 'P1',
  'sil': 'P2',
  'club': 'P2',
  'general': 'P3',
};


export const priorityToNumber = (priority: PriorityLevel): number => {
  const map: Record<PriorityLevel, number> = {
    'P0': 0, 
    'P1': 1,
    'P2': 2,
    'P3': 3, 
  };
  return map[priority] ?? 3;
};

export const numberToPriority = (num: number): PriorityLevel => {
  if (num === 0) return 'P0';
  if (num === 1) return 'P1';
  if (num === 2) return 'P2';
  return 'P3';
};


export const getPriorityForCategory = (category: string): PriorityLevel => {
  if (!category) return 'P3';
  
  const normalizedCategory = category.toLowerCase().trim();
  
  if (CATEGORY_PRIORITY_MAP[normalizedCategory]) {
    return CATEGORY_PRIORITY_MAP[normalizedCategory];
  }
  
  const underscoreCategory = normalizedCategory.replace(/-/g, '_');
  if (CATEGORY_PRIORITY_MAP[underscoreCategory]) {
    return CATEGORY_PRIORITY_MAP[underscoreCategory];
  }
  
  const hyphenCategory = normalizedCategory.replace(/_/g, '-');
  if (CATEGORY_PRIORITY_MAP[hyphenCategory]) {
    return CATEGORY_PRIORITY_MAP[hyphenCategory];
  }
  
  return 'P3';
};


export const getPriorityDisplayName = (priority: PriorityLevel): string => {
  const names: Record<PriorityLevel, string> = {
    'P0': 'Highest Priority',
    'P1': 'High Priority',
    'P2': 'Medium Priority',
    'P3': 'Normal Priority',
  };
  return names[priority];
};


export const getPriorityExamples = (priority: PriorityLevel): string[] => {
  const examples: Record<PriorityLevel, string[]> = {
    'P0': ['Emergency Announcement 🚨 (handled via emergency flag)'],
    'P1': ['Academic Announcements', 'Results', 'Re-exam'],
    'P2': ['Tech Events', 'Tech Workshops', 'Cultural Events'],
    'P3': ['General announcements'],
  };
  return examples[priority];
};

export const getPriorityColor = (priority: PriorityLevel): string => {
  const colors: Record<PriorityLevel, string> = {
    'P0': 'red',
    'P1': 'orange',
    'P2': 'yellow',
    'P3': 'gray',
  };
  return colors[priority];
};

