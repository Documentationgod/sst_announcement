export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'academic':
      return 'from-green-500 to-emerald-500'
    case 'sil':
      return 'from-blue-500 to-cyan-500'
    case 'club':
      return 'from-purple-500 to-pink-500'
    case 'general':
      return 'from-gray-500 to-slate-500'
    default:
      return 'from-gray-500 to-slate-500'
  }
}

export const getCategoryAccentClasses = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'academic':
      return 'hover:shadow-green-500/30'
    case 'sil':
      return 'hover:shadow-blue-500/30'
    case 'club':
      return 'hover:shadow-purple-500/30'
    case 'general':
      return 'hover:shadow-gray-500/30'
    default:
      return 'hover:shadow-gray-500/30'
  }
}

export const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'academic':
      return (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      )
    case 'sil':
      return (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      )
    case 'club':
      return (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      )
    case 'general':
    default:
      return (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h8M5 6a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H5z" />
      )
  }
}

