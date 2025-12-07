import type { Announcement } from '@/types'
import { isAnnouncementExpired } from './dateUtils'
import { PriorityLevel, numberToPriority, priorityToNumber } from './priorityMapping'

export type UserRole = 'student' | 'student_admin' | 'admin' | 'super_admin'

export const normalizeUserRole = (role: string | undefined, isAdmin?: boolean): UserRole => {
  if (!role) {
    return isAdmin ? 'admin' : 'student'
  }
  
  const roleMapping: Record<string, UserRole> = {
    'user': 'student',
    'student': 'student',
    'student_admin': 'student_admin', 
    'admin': 'admin',
    'super_admin': 'super_admin'
  }
  
  return roleMapping[role] || (isAdmin ? 'admin' : 'student')
}

export const hasAdminAccess = (userRole: UserRole): boolean => {
  return ['admin', 'student_admin', 'super_admin'].includes(userRole)
}

export const getAnnouncementPriority = (userRole: UserRole): number => {
  const announcementPriority: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,
    admin: 3,          
    super_admin: 4,
  }
  return announcementPriority[userRole] || 1
}

export const getMaxPriorityForRole = (userRole: UserRole): PriorityLevel => {
  const maxPriority: Record<UserRole, PriorityLevel> = {
    student: 'P3',           
    student_admin: 'P2',      
    admin: 'P1',             
    super_admin: 'P0',        
  }
  return maxPriority[userRole] || 'P3'
}

export const getMaxPriorityNumberForRole = (userRole: UserRole): number => {
  const maxPriority = getMaxPriorityForRole(userRole)
  return priorityToNumber(maxPriority)
}

export const canSetPriorityLevel = (userRole: UserRole, priorityLevel: number): boolean => {
  const maxPriorityNum = getMaxPriorityNumberForRole(userRole)
  return priorityLevel >= 0 && priorityLevel <= maxPriorityNum
}

export const getAccessLevel = (userRole: UserRole): number => {
  const accessHierarchy: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,  
    admin: 2,          
    super_admin: 3,
  }
  return accessHierarchy[userRole] || 1
}

export const isVisibleToUser = (
  announcement: Announcement, 
  userRole: UserRole = 'student',
  isAdmin?: boolean, 
  userId?: number, 
  isSuperAdmin?: boolean,
  studentIntakeCode?: number | null
): boolean => {
  const hasAdminLevel = hasAdminAccess(userRole)
  const now = new Date()
  const isEmergency = announcement.is_emergency || false
  
  // Emergency announcements have special visibility rules
  if (isEmergency) {
    // Check if emergency has expired
    if (announcement.emergency_expires_at) {
      const emergencyExpiry = new Date(announcement.emergency_expires_at)
      if (!isNaN(emergencyExpiry.getTime()) && emergencyExpiry < now) {
        return false // Emergency has expired
      }
    }
    
    // Emergency announcements bypass scheduled_at and expiry_date checks
    // But still respect target_years if set
    if (!hasAdminLevel && !isSuperAdmin) {
      const targetYears = Array.isArray(announcement.target_years) ? announcement.target_years : null
      if (targetYears && targetYears.length > 0) {
        if (!studentIntakeCode || !targetYears.includes(studentIntakeCode)) {
          return false
        }
      }
    }
    
    return true // Emergency announcements are visible until emergency_expires_at
  }
  
  // Regular announcements follow normal visibility rules
  if (!hasAdminLevel && !isSuperAdmin) {
    // Allow scheduled announcements to be visible (like policies/upcoming events)
    // Only hide if scheduled for future (not yet time to show)
    if (announcement.scheduled_at) {
      const scheduledDate = new Date(announcement.scheduled_at)
      if (!isNaN(scheduledDate.getTime())) {
        // Hide if scheduled for future (not yet time to show)
        // Once scheduled time has passed, announcement is live and should be visible
        if (scheduledDate > now) {
          return false
        }
      }
    }

    const targetYears = Array.isArray(announcement.target_years) ? announcement.target_years : null
    if (targetYears && targetYears.length > 0) {
      if (!studentIntakeCode || !targetYears.includes(studentIntakeCode)) {
        return false
      }
    }
  }
  
  return true
}

export const filterByCategory = (announcements: Announcement[], category: string): Announcement[] => {
  if (category === 'all') return announcements
  return announcements.filter(a => a.category.toLowerCase() === category.toLowerCase())
}

export const searchAnnouncements = (announcements: Announcement[], query: string): Announcement[] => {
  if (!query.trim()) return announcements
  const lowerQuery = query.toLowerCase()
  return announcements.filter(a => 
    a.title.toLowerCase().includes(lowerQuery) || 
    a.description.toLowerCase().includes(lowerQuery)
  )
}

// Helper function to get the nearest upcoming deadline or expiry date
function getNearestApproachingDate(announcement: Announcement, now: Date): { date: Date | null; type: 'expiry' | 'deadline' | null } {
  const WARNING_DAYS = 7; // Show warnings for dates within 7 days
  const warningThreshold = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);
  
  let nearestDate: Date | null = null;
  let nearestType: 'expiry' | 'deadline' | null = null;
  
  // Check expiry date
  if (announcement.expiry_date) {
    const expiryDate = new Date(announcement.expiry_date);
    if (!isNaN(expiryDate.getTime()) && expiryDate > now && expiryDate <= warningThreshold) {
      nearestDate = expiryDate;
      nearestType = 'expiry';
    }
  }
  
  // Check deadlines
  if (announcement.deadlines && Array.isArray(announcement.deadlines) && announcement.deadlines.length > 0) {
    for (const deadline of announcement.deadlines) {
      if (deadline.date) {
        const deadlineDate = new Date(deadline.date);
        if (!isNaN(deadlineDate.getTime()) && deadlineDate > now && deadlineDate <= warningThreshold) {
          if (!nearestDate || deadlineDate < nearestDate) {
            nearestDate = deadlineDate;
            nearestType = 'deadline';
          }
        }
      }
    }
  }
  
  return { date: nearestDate, type: nearestType };
}

export const sortAnnouncementsByPriority = (announcements: Announcement[], userRole: UserRole): Announcement[] => {
  const now = new Date()
  
  return [...announcements].sort((a, b) => {
    const aIsEmergency = a.is_emergency || false
    const bIsEmergency = b.is_emergency || false
    
    // Emergency announcements always come first
    if (aIsEmergency && !bIsEmergency) return -1
    if (!aIsEmergency && bIsEmergency) return 1
    
    // If both are emergency, sort by emergency_expires_at (active ones first, then by expiry time)
    if (aIsEmergency && bIsEmergency) {
      const aEmergencyExpiry = a.emergency_expires_at ? new Date(a.emergency_expires_at) : null
      const bEmergencyExpiry = b.emergency_expires_at ? new Date(b.emergency_expires_at) : null
      
      const aIsActive = !aEmergencyExpiry || aEmergencyExpiry > now
      const bIsActive = !bEmergencyExpiry || bEmergencyExpiry > now
      
      // Active emergencies come before expired ones
      if (aIsActive && !bIsActive) return -1
      if (!aIsActive && bIsActive) return 1
      
      // Both active or both expired - sort by expiry time (sooner expiry first for active, later expiry first for expired)
      if (aIsActive && bIsActive) {
        if (aEmergencyExpiry && bEmergencyExpiry) {
          return aEmergencyExpiry.getTime() - bEmergencyExpiry.getTime()
        }
        if (aEmergencyExpiry) return -1
        if (bEmergencyExpiry) return 1
      }
      
      // Fallback to creation date for emergencies
      const aDate = new Date(a.created_at || 0)
      const bDate = new Date(b.created_at || 0)
      return bDate.getTime() - aDate.getTime()
    }
    
    // Prioritize announcements with approaching expiry dates or deadlines (ONLY for students)
    // Admins, student admins, and super admins see normal priority sorting
    if (userRole === 'student') {
      const aApproaching = getNearestApproachingDate(a, now);
      const bApproaching = getNearestApproachingDate(b, now);
      
      if (aApproaching.date && !bApproaching.date) return -1; // a has approaching date, b doesn't
      if (!aApproaching.date && bApproaching.date) return 1;  // b has approaching date, a doesn't
      
      // Both have approaching dates - sort by which is sooner
      if (aApproaching.date && bApproaching.date) {
        return aApproaching.date.getTime() - bApproaching.date.getTime();
      }
    }
    
    // Regular announcements follow normal priority sorting
    const aPriorityNum = a.priority_level ?? 3
    const bPriorityNum = b.priority_level ?? 3
    
    const aDate = new Date(a.created_at || 0)
    const bDate = new Date(b.created_at || 0)
    const timeDiff = Math.abs(aDate.getTime() - bDate.getTime())
    
    const SAME_TIME_THRESHOLD = 1000 
    if (timeDiff <= SAME_TIME_THRESHOLD) {
      if (aPriorityNum !== bPriorityNum) {
        return aPriorityNum - bPriorityNum 
      }
      return (b.id ?? 0) - (a.id ?? 0)
    }
    
    if (aPriorityNum !== bPriorityNum) {
      return aPriorityNum - bPriorityNum 
    }
    
    const aPriorityUntil = a.priority_until ? new Date(a.priority_until) : null
    const bPriorityUntil = b.priority_until ? new Date(b.priority_until) : null
    
    const aHasPriority = aPriorityUntil && aPriorityUntil > now && a.status === 'urgent'
    const bHasPriority = bPriorityUntil && bPriorityUntil > now && b.status === 'urgent'
    
    if (aHasPriority && !bHasPriority) return -1
    if (!aHasPriority && bHasPriority) return 1
    
    return bDate.getTime() - aDate.getTime()
  })
}

export const filterAnnouncementsByRole = (announcements: Announcement[], userRole: UserRole): Announcement[] => {
  return announcements.filter(announcement => {
    if (userRole === 'super_admin') return true
    
    if (userRole === 'admin') {
      return true
    }
    
    if (userRole === 'student_admin') {
      return true
    }
    
    // For students: show active announcements OR announcements with deadlines
    const hasDeadlines = announcement.deadlines && Array.isArray(announcement.deadlines) && announcement.deadlines.length > 0;
    const isActive = announcement.status === 'active' && announcement.is_active !== false;
    
    // Show if active OR has deadlines (so students can see deadline announcements)
    return isActive || hasDeadlines;
  })
}

export const getUniqueCategories = (announcements: Announcement[], userRole: UserRole): string[] => {
  const categories = new Set<string>()
  
  announcements.forEach(announcement => {
    if (isVisibleToUser(announcement, userRole)) {
      categories.add(announcement.category)
    }
  })
  
  return Array.from(categories).sort()
}

export const canPerformAdminActions = (userRole: UserRole): boolean => {
  return hasAdminAccess(userRole)
}

export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'super_admin'
}

export const getRoleDisplay = (role: UserRole): string => {
  const roleDisplayMap: Record<UserRole, string> = {
    student: 'Student',
    student_admin: 'Student Admin',
    admin: 'Admin',
    super_admin: 'Super Admin'
  }
  return roleDisplayMap[role] || 'Student'
}