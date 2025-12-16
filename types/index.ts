
export interface Deadline {
  label: string;   
  date: string;    
}

export interface Announcement {
  id?: number
  title: string
  description: string
  category: string
  author_id: number
  created_at?: string
  updated_at?: string
  expiry_date?: string
  deadlines?: Deadline[] | null  
  scheduled_at?: string
  reminder_time?: string
  is_active?: boolean
  status?: 'scheduled' | 'active' | 'urgent' | 'expired'
  send_email?: boolean
  email_sent?: boolean
  send_tv?: boolean
  priority_until?: string | null
  is_emergency?: boolean
  emergency_expires_at?: string | null
  visible_after?: string | null
  priority_level?: number 
  target_years?: number[] | null
  url?: string | null
}

export interface User {
  id: number
  google_id: string
  email: string
  username?: string
  role?: 'student' | 'student_admin' | 'admin' | 'super_admin'
  is_admin?: boolean
  intake_year?: number | null
  year_level?: number | null
  batch?: string | null // e.g., "23", "24A", "24B", "25A", "25B", "25C", "25D"
  created_at?: string
  last_login?: string
}

export interface CreateAnnouncementData {
  title: string
  description: string
  category: string
  expiry_date?: string
  deadlines?: Deadline[] | null  // Array of deadlines
  scheduled_at?: string
  reminder_time?: string
  is_active?: boolean
  status?: string
  send_email?: boolean
  send_tv?: boolean
  priority_until?: string | null
  is_emergency?: boolean
  emergency_expires_at?: string 
  priority_level?: number 
  target_years?: number[] | null
  url?: string | null
}

export interface UpdateAnnouncementData {
  title?: string
  description?: string
  category?: string
  expiry_date?: string
  deadlines?: Deadline[] | null  
  scheduled_at?: string
  reminder_time?: string
  is_active?: boolean
  status?: string
  priority_until?: string | null
  priority_level?: number 
  target_years?: number[] | null
  url?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AdminDashboardData {
  totalUsers: number
  adminUsers: number
  studentUsers: number
  superAdminUsers?: number
  recentUsers: User[]
  roleBreakdown?: {
    student: number
    student_admin: number
    admin: number
    super_admin: number
  }
  endpoints?: {
    getAllUsers: string
    getUserById: string
    updateAdminStatus: string
    updateUserRole: string
    searchUser: string
  }
}

export interface AdminLimits {
  limit_per_day: number
  posted_today: number
  can_post: boolean
}

export interface AdminConfigInfo {
  environment: string
  frontend_url: string
  backend_url: string
  auth_provider: 'clerk'
}
