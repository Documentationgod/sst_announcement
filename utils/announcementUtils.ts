import type { Announcement } from '@/types'
import { isAnnouncementExpired } from './dateUtils'

export type UserRole = 'student' | 'student_admin' | 'admin' | 'super_admin'

/**
 * Normalize role from database format to frontend format
 * Handles backward compatibility with old role names
 */
export const normalizeUserRole = (role: string | undefined, isAdmin?: boolean): UserRole => {
  if (!role) {
    return isAdmin ? 'admin' : 'student'
  }
  
  // Handle old format mappings
  const roleMapping: Record<string, UserRole> = {
    'user': 'student',
    'superadmin': 'super_admin',
    'student': 'student',
    'student_admin': 'student_admin', 
    'admin': 'admin',
    'super_admin': 'super_admin'
  }
  
  return roleMapping[role] || (isAdmin ? 'admin' : 'student')
}

/**
 * Check if user has admin-level access (both admin and student_admin)
 */
export const hasAdminAccess = (userRole: UserRole): boolean => {
  return ['admin', 'student_admin', 'super_admin'].includes(userRole)
}

/**
 * Get announcement priority for user role
 * Admin has higher priority than student_admin for announcements
 */
export const getAnnouncementPriority = (userRole: UserRole): number => {
  const announcementPriority: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,
    admin: 3,          // Higher priority than student_admin
    super_admin: 4,
  }
  return announcementPriority[userRole] || 1
}

/**
 * Get general access level (admin and student_admin have same access)
 */
export const getAccessLevel = (userRole: UserRole): number => {
  const accessHierarchy: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,  // Same access level as admin
    admin: 2,          // Same access level as student_admin
    super_admin: 3,
  }
  return accessHierarchy[userRole] || 1
}

/**
 * Filter announcements that are visible to the user
 * Updated to use role-based logic instead of just isAdmin boolean
 */
export const isVisibleToUser = (
  announcement: Announcement, 
  userRole: UserRole = 'student',
  isAdmin?: boolean, 
  userId?: number, 
  isSuperAdmin?: boolean
): boolean => {
  const hasAdminLevel = hasAdminAccess(userRole)
  const now = new Date()
  
  // IMPORTANT: Hide ALL scheduled announcements from regular users
  // Regular users should NEVER see scheduled announcements, regardless of status
  if (!hasAdminLevel && !isSuperAdmin) {
    // Hide if status is 'scheduled'
    if (announcement.status === 'scheduled') {
      return false
    }
    
    // Hide if category is 'scheduled' (admin-only category)
    if (announcement.category && announcement.category.toLowerCase() === 'scheduled') {
      return false
    }
    
    // Hide if announcement has a future scheduled_at date
    if (announcement.scheduled_at) {
      const scheduledDate = new Date(announcement.scheduled_at)
      if (!isNaN(scheduledDate.getTime()) && scheduledDate > now) {
        return false
      }
    }
  }
  
  // Admin-level users can see everything for backward compatibility
  if (hasAdminLevel) return true
  
  // Regular users: check visibility rules
  
  // Hide under_review announcements from regular users
  if (announcement.status === 'under_review') return false
  
  // Hide rejected announcements from regular users
  if (announcement.status === 'rejected') return false
  
  // Hide inactive announcements from regular users
  if (announcement.is_active === false) return false
  
  // Hide expired announcements from regular users
  if (isAnnouncementExpired(announcement)) return false
  
  // Show active announcements to regular users
  return true
}

/**
 * Filter announcements by category
 */
export const filterByCategory = (announcements: Announcement[], category: string): Announcement[] => {
  if (category === 'all') return announcements
  return announcements.filter(a => a.category.toLowerCase() === category.toLowerCase())
}

/**
 * Search announcements by title and description
 */
export const searchAnnouncements = (announcements: Announcement[], query: string): Announcement[] => {
  if (!query.trim()) return announcements
  const lowerQuery = query.toLowerCase()
  return announcements.filter(a => 
    a.title.toLowerCase().includes(lowerQuery) || 
    a.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Sort announcements by priority based on user role
 */
export const sortAnnouncementsByPriority = (announcements: Announcement[], userRole: UserRole): Announcement[] => {
  return [...announcements].sort((a, b) => {
    // Emergency announcements always come first
    if (a.is_emergency && !b.is_emergency) return -1
    if (!a.is_emergency && b.is_emergency) return 1
    
    // Priority until date (urgent status)
    const aPriorityUntil = a.priority_until ? new Date(a.priority_until) : null
    const bPriorityUntil = b.priority_until ? new Date(b.priority_until) : null
    const now = new Date()
    
    const aHasPriority = aPriorityUntil && aPriorityUntil > now && a.status === 'urgent'
    const bHasPriority = bPriorityUntil && bPriorityUntil > now && b.status === 'urgent'
    
    if (aHasPriority && !bHasPriority) return -1
    if (!aHasPriority && bHasPriority) return 1
    
    // Then by creation date (newest first)
    const aDate = new Date(a.created_at || 0)
    const bDate = new Date(b.created_at || 0)
    return bDate.getTime() - aDate.getTime()
  })
}

/**
 * Filter announcements by role-specific visibility
 */
export const filterAnnouncementsByRole = (announcements: Announcement[], userRole: UserRole): Announcement[] => {
  return announcements.filter(announcement => {
    // Super admins can see everything
    if (userRole === 'super_admin') return true
    
    // Admins can see most things except super admin specific
    if (userRole === 'admin') {
      // Hide super admin specific announcements if any
      return true
    }
    
    // Student admins can see student and student admin content
    if (userRole === 'student_admin') {
      return true
    }
    
    // Students can only see public content
    return announcement.status === 'active' && announcement.is_active !== false
  })
}

/**
 * Get unique categories from announcements
 */
export const getUniqueCategories = (announcements: Announcement[], userRole: UserRole): string[] => {
  const categories = new Set<string>()
  
  announcements.forEach(announcement => {
    if (isVisibleToUser(announcement, userRole)) {
      categories.add(announcement.category)
    }
  })
  
  return Array.from(categories).sort()
}

/**
 * Check if user can perform admin actions
 */
export const canPerformAdminActions = (userRole: UserRole): boolean => {
  return hasAdminAccess(userRole)
}

/**
 * Check if user can manage other users (super admin only)
 */
export const canManageUsers = (userRole: UserRole): boolean => {
  return userRole === 'super_admin'
}

/**
 * Get display name for user role
 */
export const getRoleDisplay = (role: UserRole): string => {
  const roleDisplayMap: Record<UserRole, string> = {
    student: 'Student',
    student_admin: 'Student Admin',
    admin: 'Admin',
    super_admin: 'Super Admin'
  }
  return roleDisplayMap[role] || 'Student'
}